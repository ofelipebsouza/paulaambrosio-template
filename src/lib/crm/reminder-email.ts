/**
 * Follow-up reminder email — one digest instead of one message per task.
 *
 * Sent by the cron route when the team has let a deadline pass. Uses the same
 * shell (and therefore the same centered logo) as the inquiry templates, so a
 * reminder reads as a studio message and not as a system alert.
 *
 * The visitor's address is never a recipient: the digest goes to the studio
 * inbox and only masks the lead address in the body.
 */
import { emailShell, escapeHtml, SITE_HOST, type ComposedEmail } from '../contact-email';
import { maskEmail, type CrmTask } from './schema';

const INK = '#111111';
const STONE = '#8C6A54';
const SAND = '#CEB297';
const GRAPHITE = '#5A5651';
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const STUDIO_SIGNATURE = 'Paula Ambrosio Interiors';

function hoursLate(dueAt: number, now: number): string {
	const hours = Math.round((now - dueAt) / 3_600_000);
	if (hours < 1) return 'due now';
	if (hours < 48) return `${hours}h late`;
	return `${Math.round(hours / 24)}d late`;
}

export function composeFollowUpReminder(tasks: CrmTask[], now = Date.now()): ComposedEmail {
	const overdue = tasks.filter((task) => task.state === 'open' && task.dueAt <= now);
	const subject =
		overdue.length === 1
			? `Follow-up due — ${overdue[0].leadName}`
			: `${overdue.length} follow-ups are waiting`;

	const lines = overdue.map(
		(task) => `• ${task.title} (${hoursLate(task.dueAt, now)}) — ${maskEmail(task.leadEmail)}`,
	);
	const text = [
		STUDIO_SIGNATURE,
		'Follow-up reminder',
		'',
		...lines,
		'',
		`Open the pipeline: https://${SITE_HOST}/admin/`,
	].join('\n');

	const body = [
		`<tr><td style="font-family:${SANS};font-size:15px;line-height:1.7;color:${INK};padding-bottom:24px;">${overdue.length} follow-up${overdue.length === 1 ? '' : 's'} passed the deadline. Each lead below is still waiting for the studio's first reply.</td></tr>`,
		'<tr><td style="padding:0 0 24px 0;">',
		...overdue.slice(0, 15).map(
			(task) => `<div style="border-left:2px solid ${SAND};padding:10px 0 10px 16px;margin-bottom:12px;background:#FFFFFF;">
				<div style="font-family:${SANS};font-size:14px;color:${INK};font-weight:600;">${escapeHtml(task.title)}</div>
				<div style="font-family:${SANS};font-size:12px;color:${STONE};padding-top:4px;">${escapeHtml(hoursLate(task.dueAt, now))} · ${escapeHtml(maskEmail(task.leadEmail))}</div>
			</div>`,
		),
		overdue.length > 15 ? `<div style="font-family:${SANS};font-size:12px;color:${GRAPHITE};">…and ${overdue.length - 15} more in the pipeline.</div>` : '',
		'</td></tr>',
		`<tr><td><a href="https://${SITE_HOST}/admin/" style="display:inline-block;background:${INK};color:#FFFFFF;font-family:${SANS};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">Open the CRM</a></td></tr>`,
	].join('');

	return {
		subject,
		text,
		html: emailShell({
			heading: 'Follow-up reminder',
			body,
			footnote: `${STUDIO_SIGNATURE} · automated digest sent when a follow-up deadline passes · <a href="https://${SITE_HOST}/admin/" style="color:${STONE};text-decoration:none;">${SITE_HOST}/admin/</a>`,
		}),
	};
}
