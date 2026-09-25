/**
 * Inquiry email templates.
 *
 * Two messages are produced for every accepted submission:
 *  - the lead notification sent to the studio, with `replyTo` set to the
 *    visitor so Paula can answer from her own inbox;
 *  - a short confirmation sent to the visitor.
 *
 * Every interpolated value is HTML-escaped — user input never reaches the
 * markup unescaped. Copy stays restrained and human: no marketing filler.
 */
import { CONTACT_FIELDS, type ContactFieldName } from './contact-form';

export interface ContactPayload {
	name: string;
	email: string;
	phone: string;
	location: string;
	propertyType: string;
	service: string;
	budget: string;
	timeline: string;
	message: string;
}

export interface ComposedEmail {
	subject: string;
	text: string;
	html: string;
}

const INK = '#111111';
const STONE = '#8C6A54';
const SAND = '#CEB297';
const IVORY = '#F9F5F0';
const GRAPHITE = '#5A5651';

const SERIF = "Georgia, 'Times New Roman', Times, serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export const SITE_HOST = 'paulaambrosio.com';
const STUDIO_SIGNATURE = 'Paula Ambrosio Interiors';
const STUDIO_LOCATION = 'Miami, Florida';

export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/** Keeps the composed subject line free of header-injection characters. */
export function safeSubjectFragment(value: string): string {
	return value.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, 120);
}

function label(field: ContactFieldName): string {
	return CONTACT_FIELDS.find((spec) => spec.name === field)?.label ?? field;
}

function rows(data: ContactPayload): Array<{ label: string; value: string }> {
	return CONTACT_FIELDS.filter((spec) => spec.name !== 'message' && data[spec.name]).map((spec) => ({
		label: spec.label,
		value: data[spec.name],
	}));
}

/* -------------------------------------------------------------------------- */
/* Lead notification                                                          */
/* -------------------------------------------------------------------------- */

export function composeLeadEmail(data: ContactPayload, recipient: string): ComposedEmail {
	const name = safeSubjectFragment(data.name);
	const subject = `New Project Inquiry — ${name}`;

	const text = [
		STUDIO_SIGNATURE,
		'New Project Inquiry',
		'',
		...rows(data).map((row) => `${row.label}: ${row.value}`),
		'',
		'Message:',
		data.message,
		'',
		`Reply directly to this email to answer ${name} at ${data.email}.`,
		`Submitted from: ${SITE_HOST}`,
	]
		.filter((line) => line !== undefined)
		.join('\n');

	const html = emailShell({
		heading: 'New Project Inquiry',
		body: `
			${rows(data)
				.map(
					(row) => `<tr>
						<td style="padding:0 0 18px 0;">
							<div style="font-family:${SANS};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${GRAPHITE};">${escapeHtml(row.label)}</div>
							<div style="font-family:${SANS};font-size:15px;line-height:1.6;color:${INK};padding-top:4px;">${escapeHtml(row.value)}</div>
						</td>
					</tr>`,
				)
				.join('')}
			<tr>
				<td style="padding:6px 0 0 0;">
					<div style="font-family:${SANS};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${GRAPHITE};">${escapeHtml(label('message'))}</div>
					<div style="margin-top:8px;padding:18px 20px;border:1px solid ${SAND};background:#FFFFFF;font-family:${SANS};font-size:15px;line-height:1.75;color:${INK};white-space:pre-wrap;">${escapeHtml(data.message)}</div>
				</td>
			</tr>`,
		footnote: `Reply to this email to answer ${escapeHtml(name)} directly at ${escapeHtml(data.email)}.<br />Submitted from ${SITE_HOST} · to ${escapeHtml(recipient)}`,
	});

	return { subject, text, html };
}

/* -------------------------------------------------------------------------- */
/* Visitor confirmation                                                       */
/* -------------------------------------------------------------------------- */

export function composeConfirmationEmail(data: ContactPayload): ComposedEmail {
	// Prefer the first name: the confirmation is a courtesy note, not a form letter.
	const firstName = data.name.split(/\s+/)[0] || data.name;
	const subject = 'Thank you for contacting Paula Ambrosio Interiors';

	const text = [
		`Dear ${firstName},`,
		'',
		'Thank you for reaching out to Paula Ambrosio Interiors.',
		'',
		'We have received your project inquiry and our team will review the information you shared.',
		'',
		'We look forward to learning more about your project, your vision, and how we can create a thoughtful and beautifully executed interior tailored to the way you live.',
		'',
		'Our team will be in touch soon.',
		'',
		STUDIO_SIGNATURE,
		STUDIO_LOCATION,
		SITE_HOST,
	].join('\n');

	const html = emailShell({
		heading: 'Thank you for reaching out',
		body: `
			<tr>
				<td style="font-family:${SANS};font-size:15px;line-height:1.85;color:${INK};padding-bottom:16px;">
					Dear ${escapeHtml(firstName)},
				</td>
			</tr>
			<tr>
				<td style="font-family:${SANS};font-size:15px;line-height:1.85;color:${INK};padding-bottom:16px;">
					Thank you for reaching out to ${STUDIO_SIGNATURE}. We have received your project inquiry and our team will review the information you shared.
				</td>
			</tr>
			<tr>
				<td style="font-family:${SANS};font-size:15px;line-height:1.85;color:${INK};padding-bottom:16px;">
					We look forward to learning more about your project, your vision, and how we can create a thoughtful and beautifully executed interior tailored to the way you live.
				</td>
			</tr>
			<tr>
				<td style="font-family:${SANS};font-size:15px;line-height:1.85;color:${INK};">
					Our team will be in touch soon.
				</td>
			</tr>`,
		footnote: `${STUDIO_SIGNATURE} · ${STUDIO_LOCATION} · <a href="https://${SITE_HOST}/" style="color:${STONE};text-decoration:none;">${SITE_HOST}</a>`,
	});

	return { subject, text, html };
}

/* -------------------------------------------------------------------------- */
/* Shared shell                                                               */
/* -------------------------------------------------------------------------- */

export function emailShell({ heading, body, footnote }: { heading: string; body: string; footnote: string }): string {
	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<meta name="color-scheme" content="light only" />
		<title>${escapeHtml(heading)}</title>
	</head>
	<body style="margin:0;padding:0;background:${IVORY};-webkit-font-smoothing:antialiased;">
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${IVORY};padding:40px 16px;">
			<tr>
				<td align="center">
					<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFFFF;border:1px solid rgba(17,17,17,0.10);box-shadow:0 4px 20px rgba(0,0,0,0.03);">
						<!-- Brand header: logo centered -->
						<tr>
							<td align="center" style="padding:44px 40px 32px 40px;border-bottom:1px solid rgba(17,17,17,0.08);background:#FFFFFF;">
								<a href="https://${SITE_HOST}/" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-decoration:none;">
									<img
										src="https://${SITE_HOST}/brand/logo-email.png"
										alt="${STUDIO_SIGNATURE}"
										width="260"
										style="display:block;width:260px;max-width:100%;height:auto;border:0;outline:none;margin:0 auto;"
									/>
								</a>
							</td>
						</tr>
						<!-- Section heading -->
						<tr>
							<td style="padding:36px 40px 12px 40px;">
								<div style="font-family:${SANS};font-size:10px;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:${STONE};">${escapeHtml(heading)}</div>
							</td>
						</tr>
						<!-- Email body content -->
						<tr>
							<td style="padding:0 40px 36px 40px;">
								<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
									${body}
								</table>
							</td>
						</tr>
						<!-- Footnote -->
						<tr>
							<td style="padding:24px 40px 36px 40px;border-top:1px solid rgba(17,17,17,0.08);background:#FCFAF7;font-family:${SANS};font-size:12px;line-height:1.8;color:${GRAPHITE};">
								${footnote}
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
	</body>
</html>`;
}
