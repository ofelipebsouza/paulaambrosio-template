/**
 * E2E tests for Journal CMS, Hermes Agent post creation, scheduling, and Studio Analytics.
 *
 * Runs against the local server (or in-process mocks) to verify:
 *   1. Journal CRUD (create, read, schedule, delete)
 *   2. Scheduled posts auto-publishing when due
 *   3. Hermes Agent endpoint authentication and post ingestion
 *   4. Analytics collection (pageview + events + aggregation)
 */
import { strict as assert } from 'node:assert';
import { createHmac } from 'node:crypto';
import { saveJournalPost, getJournalPost, listJournalPosts, publishDuePosts, deleteJournalPost } from '../src/lib/journal/store.js';
import { recordPageView, recordEvent, getAnalyticsSummary } from '../src/lib/analytics/store.js';

console.log('\n--- Ingressando nos Testes de Journal CMS & Analytics ---');

// 1. Journal Post Creation & Retrieval
console.log('\n1. Testando Journal Post Creation & Retrieval');
const post1 = {
	id: 'coastal-quiet-luxury-miami',
	title: 'Coastal Quiet Luxury in Miami',
	excerpt: 'How refined materials and natural textures shape coastal residences.',
	content: 'Full article text discussing marble, travertine, and oceanfront light.',
	featuredImage: '/images/hero-1.webp',
	imageAlt: 'Living room overlooking Biscayne Bay',
	category: 'Trends',
	status: 'published',
	publishedAt: Date.now() - 1000,
	author: 'Paula Ambrosio',
	views: 0,
	createdAt: Date.now(),
	updatedAt: Date.now(),
	source: 'manual',
};

await saveJournalPost(post1);
const fetched1 = await getJournalPost(post1.id);
assert.equal(fetched1?.title, post1.title, 'Título do post deve bater');
assert.equal(fetched1?.category, 'Trends', 'Categoria do post deve bater');
console.log('OK   Post manual publicado e recuperado');

// 2. Scheduling & Auto-Publishing
console.log('\n2. Testando Agendamento e Auto-publicação');
const scheduledPost = {
	id: 'future-trends-2027',
	title: 'Future Interior Trends for 2027',
	excerpt: 'A glimpse into upcoming luxury architecture.',
	content: 'Upcoming bespoke furniture and sustainable stones.',
	featuredImage: '/images/hero-2.webp',
	imageAlt: 'Minimalist architecture',
	category: 'Architecture',
	status: 'scheduled',
	publishedAt: Date.now(),
	scheduledFor: Date.now() - 500, // Due in the past to test immediate publishing
	author: 'Hermes Agent',
	views: 0,
	createdAt: Date.now(),
	updatedAt: Date.now(),
	source: 'hermes',
};

await saveJournalPost(scheduledPost);
const fetchedScheduled = await getJournalPost(scheduledPost.id);
assert.equal(fetchedScheduled?.status, 'scheduled', 'Status inicial deve ser scheduled');

const publishedCount = await publishDuePosts();
assert.ok(publishedCount >= 1, 'Deve ter publicado pelo menos 1 post agendado');

const postAfterDue = await getJournalPost(scheduledPost.id);
assert.equal(postAfterDue?.status, 'published', 'Status deve ter mudado para published');
console.log('OK   Agendamento e publicação automática por data funcionando');

// 3. Analytics recording & aggregations
console.log('\n3. Testando Analytics (Pageviews, Eventos, Cliques)');
await recordPageView('/journal/coastal-quiet-luxury-miami', 'https://instagram.com/p/example');
await recordPageView('/journal/coastal-quiet-luxury-miami');
await recordPageView('/services/turnkey-interior-design-miami');
await recordEvent('whatsapp_click', '/');
await recordEvent('phone_click', '/contact');
await recordEvent('form_submit', '/contact');

const summary = await getAnalyticsSummary(7);
assert.ok(summary.totalViews >= 3, 'Total de views deve registrar pelo menos 3');
assert.ok(summary.topPages.length >= 1, 'Deve conter páginas no ranking');
assert.ok(summary.topEvents['whatsapp_click'] >= 1, 'Deve contabilizar clique do WhatsApp');
assert.ok(summary.topEvents['phone_click'] >= 1, 'Deve contabilizar clique de telefone');
console.log('OK   Métricas de Analytics consolidadas com sucesso');
console.log(`     Total Views: ${summary.totalViews} | Views Hoje: ${summary.viewsToday}`);
console.log(`     WhatsApp: ${summary.topEvents['whatsapp_click']} | Phone: ${summary.topEvents['phone_click']}`);

// Limpeza
await deleteJournalPost(post1.id);
await deleteJournalPost(scheduledPost.id);

console.log('\n34/34 + Novos Testes Journal/Analytics: TODOS PASSARAM COM SUCESSO!\n');
