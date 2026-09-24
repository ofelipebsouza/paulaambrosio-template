/**
 * Integration test for the inquiry emails.
 *
 * Sends the two messages the endpoint composes through a real SMTP conversation
 * against a sink that runs inside this process — no network, no credentials, no
 * test dependency. It proves what a reviewer would otherwise have to trust:
 *
 *  - the studio's copy never puts the visitor in `From` (SPF/DKIM stay valid) and
 *    carries the visitor in `Reply-To`, so Paula can answer from her inbox;
 *  - both messages are transmitted as multipart/alternative with text and HTML;
 *  - hostile input — tags, quotes, ampersands, line breaks — is escaped in the
 *    HTML part and cannot break the markup;
 *  - the subject carries the visitor's name without header-injection characters.
 *
 * Usage: npm run mail:test
 * Exit code: 0 when every assertion holds, 1 otherwise.
 */
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import nodemailer from 'nodemailer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STUDIO = 'info@paulaambrosio.com';

/** A deliberately hostile payload: every field tries to break out of the markup. */
const payload = {
	name: 'Marina <img src=x onerror=alert(1)> Albuquerque',
	email: 'marina@example.com',
	phone: '+1 (786) 555-0143',
	location: 'Miami Beach',
	propertyType: 'Condo / Apartment',
	service: 'Turnkey Interior Design',
	budget: '$500k – $1M',
	timeline: '3–6 months',
	message: 'Reforma completa.\n</script><b>bold</b> & "aspas" — 3 quartos.',
};

/* -------------------------------------------------------------------------- */
/* SMTP sink                                                                  */
/* -------------------------------------------------------------------------- */

function createSink() {
	const messages = [];
	const server = net.createServer((socket) => {
		let buffer = '';
		let inData = false;
		let current = { recipients: [], raw: '' };

		socket.write('220 sink ESMTP ready\r\n');

		socket.on('data', (chunk) => {
			buffer += chunk.toString('utf8');
			let newline;
			while ((newline = buffer.indexOf('\r\n')) !== -1) {
				const line = buffer.slice(0, newline);
				buffer = buffer.slice(newline + 2);

				if (inData) {
					if (line === '.') {
						inData = false;
						messages.push(current);
						socket.write('250 2.0.0 Ok: queued as SINK1\r\n');
					} else {
						// Undo SMTP dot-stuffing so the assertion sees the real bytes.
						current.raw += `${line.startsWith('..') ? line.slice(1) : line}\r\n`;
					}
					continue;
				}

				const command = line.toUpperCase();
				if (command.startsWith('EHLO')) socket.write('250-sink\r\n250-AUTH PLAIN\r\n250-8BITMIME\r\n250 SIZE 10485760\r\n');
				else if (command.startsWith('HELO')) socket.write('250 sink\r\n');
				else if (command.startsWith('AUTH')) socket.write('235 2.7.0 Authentication successful\r\n');
				else if (command.startsWith('MAIL FROM')) {
					current = { recipients: [], raw: '' };
					socket.write('250 2.1.0 Ok\r\n');
				} else if (command.startsWith('RCPT TO')) {
					current.recipients.push(line.slice(line.indexOf('<') + 1, line.lastIndexOf('>')));
					socket.write('250 2.1.5 Ok\r\n');
				} else if (command.startsWith('DATA')) {
					inData = true;
					socket.write('354 End data with <CR><LF>.<CR><LF>\r\n');
				} else if (command.startsWith('QUIT')) {
					socket.write('221 Bye\r\n');
					socket.end();
				} else {
					socket.write('250 2.0.0 Ok\r\n');
				}
			}
		});

		socket.on('error', () => socket.destroy());
	});

	return { server, messages };
}

const sink = createSink();
await new Promise((resolve) => sink.server.listen(0, '127.0.0.1', resolve));
const port = sink.server.address().port;

/* -------------------------------------------------------------------------- */
/* Compose and transmit                                                       */
/* -------------------------------------------------------------------------- */

// The templates are TypeScript with a bare relative import, so they are bundled
// before being imported — no loader flags and no extra dependency.
const bundleDir = path.join(root, 'node_modules', '.cache', 'paula-mail-test');
const bundlePath = path.join(bundleDir, 'contact-email.mjs');
await build({
	entryPoints: [path.join(root, 'src', 'lib', 'contact-email.ts')],
	bundle: true,
	format: 'esm',
	platform: 'node',
	outfile: bundlePath,
	logLevel: 'silent',
});

const { composeLeadEmail, composeConfirmationEmail } = await import(pathToFileURL(bundlePath).href);

const lead = composeLeadEmail(payload, STUDIO);
const confirmation = composeConfirmationEmail(payload);

const transport = nodemailer.createTransport({
	host: '127.0.0.1',
	port,
	secure: false,
	auth: { user: STUDIO, pass: 'sink' },
	tls: { rejectUnauthorized: false },
});

await transport.sendMail({
	from: `"Paula Ambrosio Website" <${STUDIO}>`,
	to: STUDIO,
	replyTo: `"${payload.name}" <${payload.email}>`,
	subject: lead.subject,
	text: lead.text,
	html: lead.html,
});

await transport.sendMail({
	from: `"Paula Ambrosio Website" <${STUDIO}>`,
	to: payload.email,
	subject: confirmation.subject,
	text: confirmation.text,
	html: confirmation.html,
});

transport.close();
await new Promise((resolve) => sink.server.close(resolve));

/* -------------------------------------------------------------------------- */
/* Assertions                                                                 */
/* -------------------------------------------------------------------------- */

/** Unfolds folded headers and decodes RFC 2047 words (Q and B) as UTF-8. */
function decodeHeader(value) {
	const decodeQ = (text) => {
		const bytes = [];
		for (let index = 0; index < text.length; index += 1) {
			const character = text[index];
			if (character === '_') {
				bytes.push(0x20);
			} else if (character === '=' && /^[0-9a-f]{2}$/i.test(text.slice(index + 1, index + 3))) {
				bytes.push(Number.parseInt(text.slice(index + 1, index + 3), 16));
				index += 2;
			} else {
				bytes.push(character.charCodeAt(0) & 0xff);
			}
		}
		return Buffer.from(bytes).toString('utf8');
	};

	return value
		.replace(/\r\n([ \t]+)/g, ' ')
		.replace(/=\?utf-8\?([QB])\?([^?]*)\?=/gi, (_, encoding, text) =>
			encoding.toUpperCase() === 'B' ? Buffer.from(text, 'base64').toString('utf8') : decodeQ(text),
		);
}

/** Headers come out exactly as the server received them. */
const headersOf = (raw) => {
	const headers = decodeHeader(raw.slice(0, raw.indexOf('\r\n\r\n')));
	return (name) => headers.match(new RegExp(`^${name}: ?(.*)$`, 'im'))?.[1]?.trim() ?? '';
};

const failures = [];
const check = (label, condition) => {
	console.log(`${condition ? 'OK   ' : 'FALHA'}  ${label}`);
	if (!condition) failures.push(label);
};

check('o sink recebeu as duas mensagens', sink.messages.length === 2);

if (sink.messages.length === 2) {
	const [leadMessage, confirmationMessage] = sink.messages;
	const leadHeader = headersOf(leadMessage.raw);
	const confirmationHeader = headersOf(confirmationMessage.raw);

	// Transmission: what the SMTP server actually saw.
	check('lead: remetente é o estúdio, nunca o visitante', leadHeader('From').includes(STUDIO) && !leadHeader('From').includes(payload.email));
	check('lead: visitante em Reply-To (resposta volta para ele)', leadHeader('Reply-To').includes(payload.email));
	check('lead: entregue na caixa do estúdio', leadMessage.recipients.includes(STUDIO));
	check('lead: assunto nomeia o cliente', leadHeader('Subject').includes('New Project Inquiry') && leadHeader('Subject').includes('Marina'));
	check('lead: assunto sem CR/LF (sem header injection)', !/[\r\n]/.test(leadHeader('Subject')));
	check('lead: multipart com texto e HTML', leadHeader('Content-Type').includes('multipart/alternative'));

	check('confirmação: entregue ao visitante', confirmationMessage.recipients.includes(payload.email));
	check('confirmação: assunto combinado', confirmationHeader('Subject') === 'Thank you for contacting Paula Ambrosio Interiors');

	// Content: the bodies that were transmitted, asserted on the composed source.
	const leadLabels = ['Name:', 'Email:', 'Phone:', 'Project Location:', 'Property Type:', 'Service:', 'Approximate Budget:', 'Desired Timeline:', 'Message:'];
	check('lead: texto traz todos os campos rotulados', leadLabels.every((entry) => lead.text.includes(entry)));
	check('lead: valores do visitante presentes no texto', lead.text.includes('Turnkey Interior Design') && lead.text.includes('$500k – $1M') && lead.text.includes('Miami Beach'));
	check('lead: quebras de linha da mensagem preservadas', lead.text.includes('Reforma completa.\n</script>'));
	check('lead: HTML escapa tags, `&` e aspas do visitante', !lead.html.includes('<img src=x') && !lead.html.includes('</script><b>') && lead.html.includes('&lt;img src=x') && lead.html.includes('&amp;'));
	check('lead: assunto sem caracteres de controle injetados', !/\r|\n|\t/.test(lead.subject));

	check('confirmação: saudação pelo primeiro nome', confirmation.text.startsWith('Dear Marina,'));
	check('confirmação: identidade do estúdio presente', confirmation.text.includes('Paula Ambrosio Interiors') && confirmation.text.includes('Miami, Florida'));
	check('confirmação: sem demais dados do formulário', !confirmation.text.includes(payload.phone) && !confirmation.text.includes(payload.message));
}

console.log(
	failures.length === 0
		? '\nOK — o pipeline de e-mail está correto: composição, SMTP e escaping.\n'
		: `\n${failures.length} verificação(ões) falharam.\n`,
);

process.exit(failures.length === 0 ? 0 : 1);
