/**
 * AI Gateway smoke test.
 *
 *   npx tsx index.ts
 *
 * Calls the Vercel AI Gateway through the AI SDK's `generateText` and prints the
 * model's answer. The key lives in `.env.local` (gitignored) and is read from
 * there — it is never printed, logged or committed.
 *
 * Everything else about this repo is a static Astro site: nothing in `src/`
 * imports this file, so it has no effect on the build or the deployed site.
 */
import dotenv from 'dotenv';
import { generateText, gateway } from 'ai';

dotenv.config({ path: ['.env.local', '.env'], quiet: true });

if (!process.env.AI_GATEWAY_API_KEY) {
	console.error(
		'AI_GATEWAY_API_KEY não encontrada.\nCrie .env.local (ignorado pelo Git) com:\n  AI_GATEWAY_API_KEY=…',
	);
	process.exit(1);
}

const { text, usage, warnings } = await generateText({
	model: gateway('openai/gpt-5.5'),
	prompt:
		'Invent a new holiday that does not exist in any country today. Give it a name, say when in the year it is celebrated, and describe three of its traditions in two or three sentences each.',
}).catch((error: unknown) => {
	// A gateway/billing failure is not a code failure: report it in one line
	// instead of a 60-line stack, and keep a non-zero exit so it cannot be
	// mistaken for a successful run.
	const message = error instanceof Error ? error.message : String(error);
	console.error(`FALHA  ${message.split('\n')[0].slice(0, 300)}`);
	process.exit(1);
});

const answer = text.trim();
if (!answer) {
	throw new Error('O gateway respondeu com texto vazio.');
}

console.log(answer);
console.log(
	`\n[modelo openai/gpt-5.5 · tokens entrada ${usage.inputTokens ?? '?'} · saída ${usage.outputTokens ?? '?'}${
		warnings?.length ? ` · avisos: ${warnings.length}` : ''
	}]`,
);
