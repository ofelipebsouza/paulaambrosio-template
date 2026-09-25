/**
 * Studio-side mailer for CRM system messages (follow-up digest).
 *
 * Same environment contract as the contact endpoint — SMTP_USER, SMTP_PASSWORD,
 * SMTP_HOST/PORT/SECURE and CONTACT_RECIPIENT_EMAIL — so switching the mail
 * provider stays an environment change, not a code change. Kept separate from
 * `api/contact.ts` so the reminder still goes out when the inquiry transport is
 * being rebuilt or tested (CONTACT_MAIL_MODE=json).
 */
import nodemailer, { type Transporter } from 'nodemailer';

const SENDER_NAME = 'Paula Ambrosio Website';

export interface StudioMail {
	subject: string;
	text: string;
	html: string;
}

export interface MailOutcome {
	sent: boolean;
	mode: 'smtp' | 'json' | 'unconfigured';
	reason?: string;
}

function buildTransport(): { transporter: Transporter | null; from: string; recipient: string; mode: MailOutcome['mode'] } {
	const user = import.meta.env.SMTP_USER;
	const password = import.meta.env.SMTP_PASSWORD;
	const recipient = String(import.meta.env.CONTACT_RECIPIENT_EMAIL || user || 'info@paulaambrosio.com');
	const forcedMode = import.meta.env.CONTACT_MAIL_MODE;

	if (forcedMode === 'json') {
		return {
			transporter: nodemailer.createTransport({ jsonTransport: true }),
			from: user ? `"${SENDER_NAME}" <${user}>` : `"${SENDER_NAME}" <${recipient}>`,
			recipient,
			mode: 'json',
		};
	}

	if (!user || !password) return { transporter: null, from: '', recipient, mode: 'unconfigured' };

	const port = Number.parseInt(String(import.meta.env.SMTP_PORT ?? '465'), 10);
	const secure = String(import.meta.env.SMTP_SECURE ?? 'true').toLowerCase() !== 'false';

	return {
		transporter: nodemailer.createTransport({
			host: import.meta.env.SMTP_HOST || 'smtpout.secureserver.net',
			port: Number.isFinite(port) ? port : 465,
			secure,
			auth: { user, pass: password },
			requireTLS: !secure,
			connectionTimeout: 10_000,
			greetingTimeout: 10_000,
			socketTimeout: 20_000,
			pool: false,
		}),
		from: `"${SENDER_NAME}" <${user}>`,
		recipient,
		mode: 'smtp',
	};
}

/** Sends to the studio inbox. Never throws — the caller only needs `sent`. */
export async function sendStudioMail(mail: StudioMail): Promise<MailOutcome> {
	const { transporter, from, recipient, mode } = buildTransport();
	if (!transporter) return { sent: false, mode };

	try {
		await transporter.sendMail({ from, to: recipient, subject: mail.subject, text: mail.text, html: mail.html });
		return { sent: mode !== 'json', mode };
	} catch (error) {
		return { sent: false, mode, reason: error instanceof Error ? error.message : 'unknown' };
	}
}
