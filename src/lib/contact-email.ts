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
import { CONTACT_FIELDS, leadOriginLabel, type ContactFieldName } from './contact-form';
import { currentInvestmentTier, isPriorityIntake, type InvestmentTier } from './lead-intake';

export interface ContactPayload {
	name: string;
	email: string;
	phone: string;
	location: string;
	propertyType: string;
	service: string;
	budget: string;
	origin?: string;
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
const STUDIO_SIGNATURE = 'Paula Ambrosio Interior Design';
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
		value: (spec.name === 'origin' ? leadOriginLabel(data.origin) : data[spec.name]) ?? '',
	}));
}

/* -------------------------------------------------------------------------- */
/* Lead notification                                                          */
/* -------------------------------------------------------------------------- */

export function composeLeadEmail(data: ContactPayload, recipient: string): ComposedEmail {
	const name = safeSubjectFragment(data.name);
	const tier = currentInvestmentTier(data.budget);
	const priority = isPriorityIntake(tier);
	// Reuse the approved studio inbox. The priority notice never goes to the lead.
	const heading = priority ? 'Priority Project Inquiry' : 'New Project Inquiry';
	const subject = priority ? `${heading} (${tier}) — ${name}` : `${heading} — ${name}`;

	const text = [
		STUDIO_SIGNATURE,
		heading,
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
		heading,
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

/** Send matching studio copy for the five current bands. Old clients retain their receipt. */
export function composeConfirmationEmail(data: ContactPayload): ComposedEmail {
	const tier = currentInvestmentTier(data.budget);
	return tier ? composeTierConfirmation(data, tier) : composeStandardConfirmation(data);
}

const STUDIO_SITE = 'https://www.paulaambrosio.com';
const DESIGN_EXPRESS_URL = `${STUDIO_SITE}/design-express-miami/`;
const DESIGN_CONSULTATION_URL = `${STUDIO_SITE}/design-consultation-miami/`;

type EmailLine = readonly (string | { text: string; href: string; bold?: boolean })[];
function composeTierConfirmation(data: ContactPayload, tier: InvestmentTier): ComposedEmail {
	const firstName = safeSubjectFragment(data.name).split(/\s+/)[0] || 'there';
	let subject = 'Your project with Paula Ambrosio Interior Design';
	const callback = (purpose: string) => data.phone && data.phone.replace(/\D/g, '').length >= 7
		? `Our team will call you within 24 hours ${purpose}.`
		: `Please reply with the best number to reach you. Our team will call within 24 hours of receiving it ${purpose}.`;
	const lines: EmailLine[] = [[`Hi ${firstName},`]];
	if (tier === 'T1') {
		lines.push(
			['Thank you for reaching out. For projects of this scope, our clients love two options: ', { text: 'Design Consultation', href: DESIGN_CONSULTATION_URL, bold: true }, ', an expert session to plan layout, materials and finishes, and ', { text: 'Design Express', href: DESIGN_EXPRESS_URL, bold: true }, ', a complete design delivered on a shorter timeline.'],
			['You can learn more here: ', { text: 'Design Express', href: DESIGN_EXPRESS_URL }, ' or ', { text: 'Design Consultation', href: DESIGN_CONSULTATION_URL }],
			[callback('to recommend the best fit and schedule your consultation')],
		);
	} else if (tier === 'T2') {
		lines.push(
			['Thank you for sharing your project with us. At this scope, we usually recommend our Luxury Residential Design service, room by room or for the entire home, with custom millwork and full coordination.'],
			[callback('to schedule a 20-minute introductory consultation')],
		);
	} else if (tier === 'T3') {
		subject = 'Your residence with Paula Ambrosio Interior Design';
		lines.push(
			['Thank you for considering our studio. For a project of this scale, our Turnkey Interior Design service manages everything from concept and procurement to installation and final styling, so you receive a finished, move in ready home.'],
			['Paula will personally review your inquiry.'],
			[callback('to schedule a private consultation')],
		);
	} else if (tier === 'T4') {
		subject = 'A private consultation with Paula Ambrosio';
		lines.push(
			["Thank you for reaching out. Projects of this scale receive Paula's direct attention from the very first conversation, with a dedicated team for design, procurement and on site coordination."],
			[callback('to schedule your consultation with Paula')],
		);
	} else {
		lines.push(
			["Thank you for reaching out. Many of our clients start without a defined budget, and that's perfectly fine. In a short call, we'll understand your goals and recommend the right path."],
			[callback('to schedule an introductory consultation')],
		);
	}
	const signature = tier === 'T4'
		? ['Paula Ambrosio', 'Principal Designer, Paula Ambrosio Interior Design']
		: [STUDIO_SIGNATURE];
	const text = lines.map((line) => line.map((part) => typeof part === 'string' ? part : `${part.text} (${part.href})`).join(''))
		.concat([`Warm regards,\n${signature.join('\n')}`]).join('\n\n');
	const body = [...lines, ['Warm regards,'], ...signature.map((line) => [line])]
		.map((line) => `<tr><td style="font-family:${SANS};font-size:15px;line-height:1.75;color:${INK};padding-bottom:14px;">${line.map((part) => {
			if (typeof part === 'string') return escapeHtml(part);
			const link = `<a href="${escapeHtml(part.href)}" style="color:${STONE};text-decoration:underline;">${escapeHtml(part.text)}</a>`;
			return ('bold' in part && part.bold) ? `<strong>${link}</strong>` : link;
		}).join('')}</td></tr>`).join('');
	const html = emailShell({ heading: subject, body, footnote: escapeHtml(STUDIO_SIGNATURE) });
	return { subject, text, html };
}

function composeStandardConfirmation(data: ContactPayload): ComposedEmail {
	// Prefer the first name: the confirmation is a courtesy note, not a form letter.
	const firstName = data.name.split(/\s+/)[0] || data.name;
	const subject = 'Thank you for contacting Paula Ambrosio Interior Design';

	const text = [
		`Dear ${firstName},`,
		'',
		'Thank you for reaching out to Paula Ambrosio Interior Design.',
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
