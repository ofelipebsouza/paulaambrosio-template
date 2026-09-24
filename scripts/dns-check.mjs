/**
 * DNS readiness check for the contact form's mail path.
 *
 * Answers one question: if an inquiry is handed to SMTP right now, will it reach
 * the studio's inbox? That needs four things in DNS — MX, SPF, DKIM and DMARC —
 * and this script names exactly which one is missing and which value to add,
 * instead of asking anyone to eyeball a dashboard.
 *
 * Queries Cloudflare's DNS-over-HTTPS endpoint, so it needs no dependency and
 * works the same on Windows, macOS, Linux and CI.
 *
 * Usage: npm run dns:check [domain]
 * Exit code: 0 when the whole mail path is ready, 1 while something is missing.
 */
const DOMAIN = (process.argv[2] ?? 'paulaambrosio.com').trim();
const DOH = 'https://cloudflare-dns.com/dns-query';

/**
 * Each profile lists the MX GoDaddy/Microsoft publish for that product and the
 * SPF includes that authorise its outbound relay. An account on a newer Titan
 * tenant answers with mx*.titan.email + include:spf.titan.email, while the
 * classic Professional Email answered with smtp.secureserver.net +
 * include:secureserver.net — GoDaddy's own help page publishes the latter for
 * "Professional Email powered by Titan", so a domain carrying it is healthy,
 * not misconfigured.
 */
const PROFILES = [
	{
		label: 'GoDaddy Professional Email (classic secureserver.net)',
		matches: ['secureserver.net'],
		mx: ['0 smtp.secureserver.net', '10 mailstore1.secureserver.net'],
		spfIncludes: ['include:secureserver.net', 'include:spf.titan.email'],
		dkimSelector: 'default',
		dkimHint: 'GoDaddy → E-mail e Office → DKIM: copie o valor gerado para default._domainkey',
	},
	{
		label: 'GoDaddy Professional Email (Titan)',
		matches: ['titan.email'],
		mx: ['mx1.titan.email (prioridade 10)', 'mx2.titan.email (prioridade 20)'],
		spfIncludes: ['include:spf.titan.email', 'include:secureserver.net'],
		dkimSelector: 'default',
		dkimHint: 'GoDaddy → E-mail e Office → DKIM: copie o valor gerado para default._domainkey',
	},
	{
		label: 'Microsoft 365',
		matches: ['protection.outlook.com'],
		mx: ['<dominio>.mail.protection.outlook.com (prioridade 0)'],
		spfIncludes: ['include:spf.protection.outlook.com'],
		dkimSelector: 'selector1',
		dkimHint: 'Microsoft 365 → Exchange → Proteção → DKIM: habilite e copie o CNAME selector1/selector2',
	},
];

/** Shown while the domain has no MX yet — the default product here is Titan. */
const TITAN = PROFILES[1];

async function query(name, type) {
	const url = `${DOH}?name=${encodeURIComponent(name)}&type=${type}`;
	const response = await fetch(url, { headers: { accept: 'application/dns-json' }, cache: 'no-store' });
	if (!response.ok) throw new Error(`DoH ${response.status} para ${name}/${type}`);
	const body = await response.json();
	return (body.Answer ?? []).map((entry) => String(entry.data).replace(/^"|"$/g, ''));
}

function providerFromMx(mxRecords) {
	const targets = mxRecords.join(' ').toLowerCase();
	return PROFILES.find((profile) => profile.matches.some((needle) => targets.includes(needle))) ?? null;
}

const results = [];
function report(status, check, detail, fix) {
	results.push({ status, check, detail, fix });
	const mark = status === 'ok' ? 'OK  ' : status === 'warn' ? 'AVISO' : 'FALTA';
	console.log(`${mark}  ${check.padEnd(14)} ${detail}`);
	if (fix && status !== 'ok') console.log(`       → ${fix}`);
}

console.log(`\nVerificando o caminho de e-mail de ${DOMAIN}\n`);

const [ns, mx, apexTxt, dmarcTxt] = await Promise.all([
	query(DOMAIN, 'NS'),
	query(DOMAIN, 'MX'),
	query(DOMAIN, 'TXT'),
	query(`_dmarc.${DOMAIN}`, 'TXT'),
]);

report(
	ns.length ? 'ok' : 'fail',
	'NS',
	ns.length ? ns.join(', ') : 'nenhum servidor autoritativo',
	'Configure o DNS do domínio antes de qualquer outra coisa.',
);

// 1. MX — without it the studio's inbox cannot receive anything at all.
const provider = providerFromMx(mx);
report(
	mx.length ? 'ok' : 'fail',
	'MX',
	mx.length ? mx.join(' | ') : 'nenhum registro MX',
	`Adicione: ${(provider ?? TITAN).mx.map((entry) => `MX @ ${entry}`).join(' e ')}`,
);

// 2. SPF — authorises the server that sends in the domain's name.
const spf = apexTxt.find((value) => value.toLowerCase().startsWith('v=spf1'));
const activeProvider = provider ?? TITAN;
const spfAuthorised = spf
	? activeProvider.spfIncludes.some((needle) => spf.includes(needle))
	: false;
report(
	spf ? (spfAuthorised ? 'ok' : 'warn') : 'fail',
	'SPF',
	spf ?? 'nenhum TXT v=spf1',
	spf
		? spfAuthorised
			? null
			: `O SPF existe mas não autoriza ${activeProvider.label}. Acrescente ${activeProvider.spfIncludes[0]} ao registro atual — mantenha um único TXT v=spf1 (SPF duplicado falha para todos).`
		: `Adicione: TXT @ "v=spf1 ${activeProvider.spfIncludes[0]} ~all"`,
);

// 3. DKIM — signature that keeps the mail out of spam.
const selectors = [...new Set([activeProvider.dkimSelector, 'default', 'titan', 'selector1', 'selector2'])];
const dkim = [];
for (const selector of selectors) {
	const records = await query(`${selector}._domainkey.${DOMAIN}`, 'TXT');
	if (records.length) dkim.push({ selector, value: records.join(' ') });
}
report(
	dkim.length ? 'ok' : 'fail',
	'DKIM',
	dkim.length ? dkim.map((entry) => `${entry.selector} (${entry.value.length} caracteres)`).join(', ') : `nenhum seletor público (testados: ${selectors.join(', ')})`,
	activeProvider.dkimHint,
);

// 4. DMARC — policy for what receivers should do with unauthenticated mail.
const dmarc = dmarcTxt.find((value) => value.toLowerCase().startsWith('v=dmarc1'));
report(
	dmarc ? 'ok' : 'fail',
	'DMARC',
	dmarc ?? 'nenhum TXT em _dmarc',
	`Adicione: TXT _dmarc "v=DMARC1; p=none; rua=mailto:info@${DOMAIN}"`,
);

const missing = results.filter((entry) => entry.status === 'fail').length;
console.log(
	missing === 0
		? `\nCaminho de e-mail pronto: MX, SPF, DKIM e DMARC publicados para ${DOMAIN}.\n`
		: `\n${missing} registro(s) essencial(is) ausente(s). Enquanto isso, o formulário entrega o lead pelo aplicativo de e-mail do visitante, não pelo servidor.\n`,
);

if (missing > 0) process.exit(1);
