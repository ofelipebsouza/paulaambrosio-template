/**
 * End-to-end lead test against a running site.
 *
 * Sends one clearly-marked test inquiry through the real endpoint, exactly as the
 * browser does, and interprets the answer. This is the only check that proves the
 * deployed configuration — that the function is routed, that the environment
 * variables are present and that the mail server accepted the message.
 *
 * Usage:
 *   npm run lead:test                                    # production
 *   npm run lead:test -- http://127.0.0.1:4321           # a local site
 *   npm run lead:test -- --email=someone@example.com     # that inbox becomes the
 *                                                        # lead and receives the
 *                                                        # confirmation (Reply-To)
 *
 * It does deliver a real message to the studio's inbox, so run it on purpose.
 */
const flags = Object.fromEntries(
	process.argv.slice(2).filter((arg) => arg.startsWith('--')).map((arg) => {
		const [key, ...rest] = arg.slice(2).split('=');
		return [key, rest.join('=') || 'true'];
	}),
);
const base = (process.argv.slice(2).find((arg) => !arg.startsWith('--')) ?? 'https://www.paulaambrosio.com').replace(/\/$/, '');
const origin = base;
const endpoint = `${base}/api/contact/`;
const stamp = new Date().toISOString();
const leadEmail = flags.email?.trim() || 'test@paulaambrosio.com';
const leadName = flags.name?.trim() || 'Website configuration test';

const form = new FormData();
form.set('name', leadName);
form.set('email', leadEmail);
form.set('phone', '+1 (000) 000-0000');
form.set('location', 'Miami');
form.set('propertyType', 'Other');
form.set('service', 'Other');
form.set('budget', 'Prefer to discuss');
form.set('timeline', 'Flexible');
form.set('message', `Automated delivery check from the website tooling. No action needed — this inquiry was generated to confirm the contact form can reach this inbox.\n\nReference: ${stamp}`);

console.log(`\nEnviando consulta de teste para ${endpoint}`);
console.log(`Assunto do lead: "New Project Inquiry — ${leadName}"`);
console.log(`Visitante/Reply-To: ${leadEmail}`);
console.log('Destino do lead: info@paulaambrosio.com\n');

let status;
let body;
try {
	const response = await fetch(endpoint, { method: 'POST', headers: { Origin: origin, Accept: 'application/json' }, body: form });
	status = response.status;
	body = await response.text();
} catch (error) {
	console.log(`FALHA  Não foi possível falar com ${endpoint}: ${error.message}\n`);
	process.exit(1);
}

console.log(`Resposta ${status}: ${body.trim().slice(0, 200)}\n`);

const interpretations = {
	200: 'OK  O lead foi aceito pelo servidor e entregue ao SMTP. Confira a caixa de entrada (e o spam) de info@paulaambrosio.com.',
	422: 'FALHA  O servidor recusou os campos — o payload do teste e a validação divergiram.',
	403: 'FALHA  Origem recusada (CSRF). Rode contra o mesmo host que serve o formulário.',
	429: 'Limite de requisições atingido. Aguarde a janela e repita.',
	502: 'FALHA  O SMTP recusou o envio. Rode `npm run smtp:check` para ver a causa (credencial, host ou porta).',
	503: 'PENDENTE  O servidor não tem transporte de e-mail: cadastre SMTP_USER/SMTP_PASSWORD na Vercel e refaça o deploy. Até lá o formulário entrega pelo aplicativo do visitante.',
	404: 'FALHA  O endpoint não existe neste deployment — verifique o adapter e o build.',
};

console.log(interpretations[status] ?? `Resposta inesperada (${status}).`);

let payload = null;
try {
	payload = JSON.parse(body);
} catch {
	payload = null;
}

if (payload?.error && status !== 503) console.log(`Detalhe: ${payload.error}`);

console.log('');
process.exit(status === 200 ? 0 : 1);
