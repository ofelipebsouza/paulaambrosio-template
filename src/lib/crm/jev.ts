/**
 * JEV scoring — the studio's lead classifier, asked over TypeSafe `systemone`.
 *
 * Every inquiry is scored once, right after it is stored: how real the project
 * is (0…1), how hot it is (hot / warm / cold / spam), what kind of project,
 * whether the stated budget fits, how urgent it is, and the sentiment. The
 * snapshot is stored on the lead document so the dashboard never needs a
 * second network call to show it.
 *
 * Rules that shaped this module:
 *
 *  · Best effort. A slow or unreachable JEV never blocks an inquiry, a status
 *    change or the dashboard: `classifyLead` resolves to `null` and the lead
 *    stays "not scored" until someone runs the backfill.
 *  · The questions are written for Paula Ambrosio Interiors, not for a generic
 *    agency — a Brickell penthouse furnishing request must not be scored with
 *    the same criteria as a landing page request.
 *  · Nothing here logs a message body or an unmasked address.
 */
import { leadRef, log } from './http';
import {
	jevBudgetFit,
	jevProjectType,
	jevSentiment,
	jevTemperature,
	temperatureFromScore,
	type CrmLead,
	type LeadJev,
} from './schema';
import { pushEvent, saveLead } from './store';

const DEFAULT_URL = 'https://api.typesafe.ai/v1/systemone';
const DEFAULT_MODEL = 'jev-latest';
const DEFAULT_TIMEOUT_MS = 6000;
/** The form waits for this one, so it gets a tighter budget than the backfill. */
const CONTACT_TIMEOUT_MS = 4000;
/** Longest message JEV reads; the rest is boilerplate we do not pay to send. */
const MESSAGE_LIMIT = 1600;

function readEnv(name: string): string {
	try {
		const value = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.[name];
		if (typeof value === 'string' && value.trim()) return value.trim();
	} catch {
		/* not running under Vite's define — fall through to the process env */
	}
	if (typeof process !== 'undefined' && process.env?.[name]) return String(process.env[name]).trim();
	return '';
}

export function jevConfigured(): boolean {
	return Boolean(readEnv('TYPESAFE_API_KEY'));
}

function apiUrl(): string {
	return readEnv('JEV_API_URL') || DEFAULT_URL;
}

function model(): string {
	return readEnv('JEV_MODEL') || DEFAULT_MODEL;
}

/**
 * What JEV reads. Everything the visitor typed plus the fields the form
 * already asked for, so the score reflects the budget and timeline the studio
 * actually collected instead of guessing from prose.
 */
function stateOf(lead: CrmLead): string {
	const lines = [
		`Name: ${lead.name}`,
		lead.location ? `Location: ${lead.location}` : '',
		lead.propertyType ? `Property: ${lead.propertyType}` : '',
		lead.service ? `Service requested: ${lead.service}` : '',
		lead.budget ? `Budget stated: ${lead.budget}` : '',
		lead.timeline ? `Timeline stated: ${lead.timeline}` : '',
		lead.page ? `Page: ${lead.page}` : '',
		`Message: ${(lead.message || '').slice(0, MESSAGE_LIMIT)}`,
	].filter(Boolean);
	return lines.join('\n');
}

/** The question set. Kept in one place so the panel copy can mirror it. */
function questions(): Record<string, unknown> {
	return {
		score: {
			type: 'noul',
			instructions:
				'Probabilidade de a mensagem ser um pedido genuino de trabalho de design de interiores de um cliente potencial. Falta de informacao nao penaliza: orcamento, prazo, servico ou localizacao ausentes valem como neutros, nao negativos. Nota baixa so quando nao e cliente (fornecedor, vendedor, pedido de emprego, spam, teste, mensagem sem pedido de servico). 1.0 = cliente real querendo contratar, 0.0 = nao e cliente',
		},
		temperature: {
			type: 'choice',
			instructions: 'Quente do esse lead',
			criteria: {
				hot: 'Cliente pedindo proposta, consulta ou para falar ja, quer contratar ou comecar',
				warm: 'Cliente real, mas ainda pesquisando ou sem pressa',
				cold: 'Duvida geral de cliente, sem intencao de contratar agora',
				spam: 'Vendedor, fornecedor, bot, pedido de emprego ou mensagem sem valor comercial',
			},
		},
		project_type: {
			type: 'choice',
			instructions: 'Tipo de projeto',
			criteria: {
				residential: 'Residencia privada, apartamento, cobertura, casa, renovacao',
				hospitality: 'Hotel, restaurante, lounge, spa, clinica de beleza',
				commercial: 'Escritorio, loja, showroom, projeto comercial',
				vendor_press: 'Fornecedor, imprensa, parceria ou colaboracao — nao e cliente',
				other: 'Nao se encaixa nas outras opcoes',
			},
		},
		budget_fit: {
			type: 'choice',
			instructions: 'O orcamento informado comporta um projeto completo de design de interiores de luxo',
			criteria: {
				high: 'Acima de 100 mil dolares',
				medium: 'Entre 30 mil e 100 mil dolares',
				low: 'Abaixo de 30 mil dolares',
				unknown: 'Nao informado ou vago',
			},
		},
		urgency: {
			type: 'score',
			instructions: 'Urgencia do cliente',
			criteria: ['Baixa - so pesquisando', 'Media - quer comecar em ate 6 meses', 'Alta - prazo definido ou data de entrega'],
		},
		sentiment: {
			type: 'choice',
			instructions: 'Sentimento da mensagem',
			criteria: {
				positive: 'Animado, elogioso, confiante',
				neutral: 'Direto e informativo',
				negative: 'Frustrado, insatisfeito ou com reclamacao',
			},
		},
	};
}

interface JevAnswer {
	type?: string;
	noul?: unknown;
	choice?: unknown;
	score?: unknown;
	legend?: Record<string, unknown>;
	confidence?: unknown;
}

function clamp01(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return Math.min(1, Math.max(0, value));
}

/**
 * JEV returns a `score` question as the index of its legend row, not as a
 * ratio: 0 / 1 / 2 for three criteria. Normalise by the legend length so the
 * stored value is always 0…1 regardless of how many criteria are defined.
 */
function normalizeUrgency(answer: JevAnswer | undefined): number {
	if (!answer || typeof answer.score !== 'number') return 0;
	const legendLength = Object.keys(answer.legend ?? {}).length || 3;
	return clamp01(answer.score / Math.max(1, legendLength - 1));
}

/**
 * Asks JEV about one lead. Resolves to `null` when JEV is not configured, the
 * request fails or the answers are unusable — the caller only writes on truth.
 */
export async function classifyLead(
	lead: CrmLead,
	{ timeoutMs = DEFAULT_TIMEOUT_MS, now = Date.now() }: { timeoutMs?: number; now?: number } = {},
): Promise<LeadJev | null> {
	const key = readEnv('TYPESAFE_API_KEY');
	if (!key) return null;

	const payload = JSON.stringify({
		state: stateOf(lead),
		model: model(),
		questions: questions(),
	});

	const started = Date.now();
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(apiUrl(), {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${key}`,
				'Content-Type': 'application/json',
				Accept: 'application/json',
				'User-Agent': 'paulaambrosio-crm/1.0',
			},
			body: payload,
			signal: controller.signal,
		});
		if (!response.ok) {
			log('warn', 'jev_classify_failed', { ...leadRef(lead), status: response.status });
			return null;
		}

		const parsed = (await response.json()) as { model?: string; answers?: Record<string, JevAnswer> };
		const answers = parsed.answers ?? {};
		const rawScore = answers.score?.noul;
		if (typeof rawScore !== 'number') {
			log('warn', 'jev_classify_empty', { ...leadRef(lead), model: parsed.model ?? '' });
			return null;
		}

		const score = clamp01(rawScore);
		const temperature = jevTemperature(answers.temperature?.choice ?? temperatureFromScore(score));

		return {
			score,
			temperature,
			projectType: jevProjectType(answers.project_type?.choice),
			budgetFit: jevBudgetFit(answers.budget_fit?.choice),
			urgency: normalizeUrgency(answers.urgency),
			sentiment: jevSentiment(answers.sentiment?.choice),
			model: parsed.model ?? model(),
			latencyMs: Date.now() - started,
			at: now,
		};
	} catch (error) {
		log('warn', 'jev_classify_failed', {
			...leadRef(lead),
			reason: error instanceof Error ? error.message : 'unknown',
		});
		return null;
	} finally {
		clearTimeout(timer);
	}
}

/**
 * Scores a lead and writes the result back to storage.
 *
 * Returns `true` only when the document actually carries a new score. Used by
 * the contact endpoint (tight timeout) and by the dashboard backfill (looser).
 */
export async function scoreLead(
	lead: CrmLead,
	opts: { timeoutMs?: number; now?: number; force?: boolean } = {},
): Promise<boolean> {
	const now = opts.now ?? Date.now();
	if (lead.jev && !opts.force) return true;

	const jev = await classifyLead(lead, { timeoutMs: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS, now });
	if (!jev) return false;

	lead.jev = jev;
	lead.updatedAt = now;

	// Spam is a review marker, never a filter: the lead stays in the pipeline
	// with a flag the studio can see, exactly like a disposable address.
	const spam = jev.temperature === 'spam' && jev.score < 0.25;
	if (spam && !lead.flags.includes('jev_spam')) lead.flags.push('jev_spam');
	if (!spam && lead.flags.includes('jev_spam')) lead.flags = lead.flags.filter((flag) => flag !== 'jev_spam');

	await saveLead(lead);
	await pushEvent(lead.id, {
		ts: now,
		type: 'note',
		detail: `JEV ${jev.temperature} · score ${Math.round(jev.score * 100)} · ${jev.projectType} · ${jev.budgetFit} budget`,
		actor: 'jev',
	});
	log('info', 'jev_scored', { ...leadRef(lead), temperature: jev.temperature, score: jev.score });
	return true;
}

/** Score with the budget the contact endpoint can afford to wait for. */
export async function scoreNewLead(lead: CrmLead): Promise<boolean> {
	if (!jevConfigured()) return false;
	try {
		return await scoreLead(lead, { timeoutMs: CONTACT_TIMEOUT_MS });
	} catch (error) {
		log('warn', 'jev_score_failed', {
			...leadRef(lead),
			reason: error instanceof Error ? error.message : 'unknown',
		});
		return false;
	}
}
