/**
 * GET /api/crm/export/?format=csv — the pipeline as a spreadsheet.
 *
 * Excel-friendly (UTF-8 BOM, CRLF) and formula-safe: a value starting with
 * `=`, `+`, `-` or `@` is prefixed with an apostrophe so a lead's message
 * cannot execute when the file is opened.
 */
import type { APIRoute } from 'astro';
import { requireCrm } from '../../../lib/crm/guard';
import { text } from '../../../lib/crm/http';
import { allLeads } from '../../../lib/crm/store';

export const prerender = false;

const HEADERS = [
	'ID',
	'Received',
	'Status',
	'Name',
	'Email',
	'Phone',
	'Location',
	'Property type',
	'Service',
	'Budget',
	'Timeline',
	'Form',
	'Page',
	'Assigned to',
	'First response',
	'Delivery',
	'Message',
	'Notes',
];

function iso(ms: number | null): string {
	return ms ? `${new Date(ms).toISOString().slice(0, 19)}Z` : '';
}

function cell(value: unknown): string {
	let out = value === null || value === undefined ? '' : String(value);
	if (/^[=+\-@\t\r]/.test(out)) out = `'${out}`;
	return `"${out.replace(/"/g, '""')}"`;
}

export const ALL: APIRoute = async ({ request }) => {
	if (request.method !== 'GET') return text('Method Not Allowed', 'text/plain; charset=utf-8', 405);

	const denied = requireCrm(request);
	if (denied) return denied;

	const leads = await allLeads();
	const rows = leads.map((lead) =>
		[
			lead.id,
			iso(lead.createdAt),
			lead.status,
			lead.name,
			lead.email,
			lead.phone,
			lead.location,
			lead.propertyType,
			lead.service,
			lead.budget,
			lead.timeline,
			lead.form,
			lead.page,
			lead.assignedTo,
			iso(lead.firstResponseAt),
			lead.delivery,
			lead.message,
			lead.notes.map((note) => `${iso(note.ts)} — ${note.text}`).join(' | '),
		]
			.map(cell)
			.join(','),
	);

	const csv = `\uFEFF${[HEADERS.map(cell).join(','), ...rows].join('\r\n')}\r\n`;
	const stamp = new Date().toISOString().slice(0, 10);

	const response = text(csv, 'text/csv; charset=utf-8', 200);
	response.headers.set('Content-Disposition', `attachment; filename="paula-ambrosio-leads-${stamp}.csv"`);
	return response;
};
