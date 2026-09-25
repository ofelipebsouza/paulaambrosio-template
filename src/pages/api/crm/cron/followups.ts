/**
 * GET|POST /api/crm/cron/followups/ — scan the follow-up queue and notify.
 *
 * Authorised two ways:
 *   · Vercel Cron sends `Authorization: Bearer $CRON_SECRET` (vercel.json);
 *   · the dashboard can call it with its own session (manual "send now").
 *
 * For every task past its deadline it emits one `task.overdue` event to JEV and
 * sends a single digest email to the studio inbox. `remindedAt` is stamped so
 * the same task is not mailed again within REMINDER_COOLDOWN.
 */
import type { APIRoute } from 'astro';
import { emitJev } from '../../../../lib/crm/automation';
import { requireCron, requireCrm } from '../../../../lib/crm/guard';
import { crmJson, leadRef, log } from '../../../../lib/crm/http';
import { composeFollowUpReminder } from '../../../../lib/crm/reminder-email';
import { sendStudioMail } from '../../../../lib/crm/mailer';
import { listTasks, saveTask, storeStatus } from '../../../../lib/crm/store';
import { publishDuePosts } from '../../../../lib/journal/store';

export const prerender = false;

/** Do not re-mail the same overdue task more often than this. */
const REMINDER_COOLDOWN_MS = 12 * 60 * 60 * 1000;

export const ALL: APIRoute = async ({ request }) => {
	if (request.method !== 'GET' && request.method !== 'POST') {
		return crmJson({ ok: false, error: 'method_not_allowed' }, 405);
	}

	// A cron call must carry CRON_SECRET; a human call must carry the session.
	if (requireCron(request) !== null) {
		const denied = requireCrm(request);
		if (denied) return denied;
	}

	const now = Date.now();
	const publishedPosts = await publishDuePosts().catch(() => 0);
	const tasks = await listTasks();
	const due = tasks.filter(
		(task) => task.state === 'open' && task.dueAt <= now && (!task.remindedAt || now - task.remindedAt >= REMINDER_COOLDOWN_MS),
	);

	if (!due.length) {
		return crmJson({ ok: true, overdue: 0, reminded: 0, publishedPosts, storage: storeStatus() });
	}

	const outcome = await sendStudioMail(composeFollowUpReminder(due, now));

	let reminded = 0;
	if (outcome.sent || outcome.mode === 'json') {
		for (const task of due) {
			task.remindedAt = now;
			await saveTask(task);
			reminded += 1;
		}
	}

	await emitJev(
		'task.overdue',
		{
			count: due.length,
			tasks: due.slice(0, 20).map((task) => ({
				leadId: task.leadId,
				title: task.title,
				dueAt: task.dueAt,
				hoursLate: Math.round((now - task.dueAt) / 3_600_000),
				lead: leadRef({ name: task.leadName, email: task.leadEmail }),
			})),
		},
		now,
	);

	log('info', 'crm_followup_reminder', {
		overdue: due.length,
		reminded,
		mail: outcome.mode,
		...(outcome.reason ? { mailError: outcome.reason } : {}),
	});

	return crmJson({
		ok: true,
		overdue: due.length,
		reminded,
		publishedPosts,
		mail: outcome.mode,
		mailSent: outcome.sent,
		storage: storeStatus(),
	});
};
