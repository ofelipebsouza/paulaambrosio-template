/**
 * SMTP readiness check for the contact form.
 *
 * Runs the exact transport the endpoint builds — same variables, same defaults,
 * same TLS decisions — against the real mail server, so a wrong host, port or
 * password is found here instead of silently failing inside a Vercel function.
 *
 * Values come from `.env.local` / `.env` (neither is committed) and can be
 * overridden by the ambient environment. The password is never printed.
 *
 * Usage:
 *   npm run smtp:check           # connect + authenticate
 *   npm run smtp:check -- --send # also deliver a test message and report the id
 */
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { randomUUID } from 'node:crypto';

dotenv.config({ path: ['.env.local', '.env'], quiet: true });

const TITAN_DEFAULT_HOST = 'smtpout.secureserver.net';

const user = process.env.SMTP_USER;
const password = process.env.SMTP_PASSWORD;
const recipient = process.env.CONTACT_RECIPIENT_EMAIL || user || `info@paulaambrosio.com`;
const host = process.env.SMTP_HOST || TITAN_DEFAULT_HOST;
const port = Number.parseInt(process.env.SMTP_PORT ?? '465', 10) || 465;
const secure = String(process.env.SMTP_SECURE ?? 'true').toLowerCase() !== 'false';
const send = process.argv.includes('--send');

if (!user || !password) {
	console.log('\nSMTP_USER e SMTP_PASSWORD não estão definidos.');
	console.log('Crie um .env.local (ignorado pelo Git) com os valores ou exporte as variáveis:');
	console.log('  SMTP_HOST=smtpout.secureserver.net');
	console.log('  SMTP_PORT=465');
	console.log('  SMTP_SECURE=true');
	console.log('  SMTP_USER=info@paulaambrosio.com');
	console.log('  SMTP_PASSWORD=…');
	console.log('  CONTACT_RECIPIENT_EMAIL=info@paulaambrosio.com\n');
	process.exit(1);
}

console.log(`\nTransporte   ${host}:${port} (${secure ? 'TLS implícito' : 'STARTTLS obrigatório'})`);
console.log(`Usuário      ${user}`);
console.log(`Senha        definida (${password.length} caracteres, nunca é exibida)`);
console.log(`Destino      ${recipient}`);
console.log(`Modo         ${process.env.CONTACT_MAIL_MODE === 'json' ? 'json (log, não envia)' : 'smtp'}\n`);

const transport = nodemailer.createTransport({
	host,
	port,
	secure,
	auth: { user, pass: password },
	requireTLS: !secure,
	connectionTimeout: 15_000,
	greetingTimeout: 15_000,
	socketTimeout: 20_000,
	pool: false,
});

let reachable = false;
try {
	await transport.verify();
	reachable = true;
	console.log('OK  Conexão e autenticação aceitas pelo servidor.');
} catch (error) {
	const code = error?.code ?? 'sem código';
	const response = error?.responseCode ?? '-';
	console.log(`FALHA  ${code} (SMTP ${response})`);

	if (response === 535 || code === 'EAUTH') {
		console.log('       O servidor recusou o usuário/senha. Confira no GoDaddy (E-mail e Office):');
		console.log('       a caixa existe e a senha é a atual — senhas de e-mail não têm relação com a do site.');
	} else if (['ENOTFOUND', 'ESOCKET', 'ETIMEDOUT', 'ECONNECTION'].includes(String(code))) {
		console.log(`       O servidor ${host}:${port} não respondeu. Confirme host/porta e a saída de rede.`);
	}
	console.log(`       Detalhe técnico: ${String(error?.message ?? '').split('\n')[0].slice(0, 160)}`);
}

if (!reachable) {
	transport.close();
	process.exit(1);
}

if (send) {
	const requestId = randomUUID();
	try {
		const info = await transport.sendMail({
			from: `"Paula Ambrosio Website" <${user}>`,
			to: recipient,
			replyTo: user,
			subject: 'SMTP test — Paula Ambrosio Interiors website',
			text: [
				'This is a delivery test from the website build tooling.',
				'If you are reading this, the contact form can reach this inbox.',
				`Reference: ${requestId}`,
			].join('\n\n'),
		});
		console.log(`OK  Mensagem de teste aceita pelo servidor (id ${info.messageId}).`);
		console.log('    Se ela não aparecer na caixa de entrada, verifique spam e os registros do domínio (npm run dns:check).');
	} catch (error) {
		console.log(`FALHA  O envio de teste foi recusado: ${String(error?.message ?? '').split('\n')[0].slice(0, 160)}`);
		console.log('       Autenticação e envio usam regras diferentes (por exemplo, remetente não permitido).');
		transport.close();
		process.exit(1);
	}
}

transport.close();
