/** Close only automatic unanswered-inquiry reminders for this lead. */
import type { CrmTask } from './schema';

export function isInitialContactTask(task: CrmTask): boolean {
	if (task.kind) return task.kind === 'first_contact' || task.kind === 'no_reply_reminder';
	// Compatibility with tasks created before kind existed. Unknown tasks stay open.
	return task.title === `First contact — reply to ${task.leadName}` ||
		task.title === `Second attempt — ${task.leadName} has not heard back`;
}

export function completeReplyTasks(tasks: CrmTask[], leadId: string, now: number): CrmTask[] {
	return tasks.filter((task) => task.leadId === leadId && task.state !== 'done' && isInitialContactTask(task))
		.map((task) => ({ ...task, state: 'done', completedAt: now }));
}
