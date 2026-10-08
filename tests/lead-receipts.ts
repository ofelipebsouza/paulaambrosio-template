import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test, { after, beforeEach } from 'node:test';
import { buildLead } from '../src/lib/crm/schema';
import { insertLeadWithReceipt, getLead, insertLead, storeStatus } from '../src/lib/crm/store';
import { INSERT_LEAD_WITH_RECEIPT_LUA, LEAD_RECEIPT_TTL_SECONDS, RECEIPT_UUID_PATTERN } from '../src/lib/crm/lead-receipt';

const now = Date.UTC(2026, 9, 8, 22);
const fingerprint = 'a'.repeat(64);
function lead(id = randomUUID()) {
 return buildLead({id, now, form: 'contact', page: '/contact/', payload: {
  name: 'Synthetic fixture', email: 'fixture@example.test', phone: '', location: '', propertyType: '',
  service: '', budget: '', timeline: '', message: 'Synthetic fixture only',
 }});
}
type Command = Array<string | number>;
const calls: Command[][] = [];
let respond: (cmds: Command[][]) => unknown = () => {throw new Error('No offline fixture response configured');};
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
 assert.equal(String(input), 'https://redis.example.test/pipeline', 'Never call live services');
 assert.equal(init?.method, 'POST');
 const cmds = JSON.parse(String(init?.body));
 calls.push(cmds);
 const result = respond(cmds);
 return result instanceof Response ? result : Response.json(result);
};
after(() => {globalThis.fetch = originalFetch;});
beforeEach(() => {calls.length = 0;});
const created = (cmds: Command[][]) => [{result: ['created', cmds[0][11], cmds[0][8]]}];

test('created result proves this invocation with an opaque server UUID in one EVAL', async () => {
 respond = created;
 const item = lead();
 const submissionId = randomUUID();
 const result = await insertLeadWithReceipt(item, submissionId.toUpperCase(), fingerprint);
 assert.equal(result.status, 'created');
 if (result.status !== 'created') return;
 assert.equal(result.leadId, item.id);
 assert.match(result.receipt.eventId, RECEIPT_UUID_PATTERN);
 assert.notEqual(result.receipt.eventId, submissionId);
 assert.equal(calls.length, 1);
 const command = calls[0][0];
 assert.deepEqual(command.slice(0, 5), ['EVAL', INSERT_LEAD_WITH_RECEIPT_LUA, 5, `crm:receipt:${submissionId}`, `crm:lead:${item.id}`]);
 assert.equal(command[10], now);
 assert.equal(command[12], fingerprint);
 assert.equal(command[15], 'create');
 assert.equal(LEAD_RECEIPT_TTL_SECONDS, 604800);
});

test('same-key replay verifies original durable lead and returns original event only', async () => {
 const originalLeadId = 'original-lead';
 const originalEvent = randomUUID();
 respond = (cmds) => [{result: cmds[0][15] === 'create'
  ? ['lookup', originalLeadId] : ['replayed', originalEvent, originalLeadId]}];
 const result = await insertLeadWithReceipt(lead('new-candidate'), randomUUID(), fingerprint);
 assert.deepEqual(result, {status: 'replayed', receipt: {eventId: originalEvent}, leadId: originalLeadId});
 assert.equal(calls.length, 2);
 assert.equal(calls[1][0][4], 'crm:lead:original-lead');
 assert.equal(calls[1][0][15], 'replay');
 assert.equal(calls[0][0][11], calls[1][0][11], 'Never generate a second candidate event ID for resolution');
});

test('same-lead replay can succeed directly; conflict returns no receipt', async () => {
 const item = lead();
 const eventId = randomUUID();
 respond = () => [{result: ['replayed', eventId, item.id]}];
 assert.deepEqual(await insertLeadWithReceipt(item, randomUUID(), fingerprint), {status:'replayed',receipt:{eventId},leadId:item.id});
 respond = () => [{result: ['conflict']}];
 assert.deepEqual(await insertLeadWithReceipt(item, randomUUID(), fingerprint), {status: 'conflict'});
 assert.equal(calls.length, 2);
});

test('malformed envelopes/results and Redis errors never fabricate acceptance or retry writes', async () => {
 const badResults: unknown[] = [[], [{}], [{error: 'WRONGTYPE'}], [{result: null}], [{result: ['created']}],
  [{result: ['created', 'not-a-uuid', 'bad']}], [{result: ['replayed', randomUUID(), 'wrong-lead']}],
  [{result: ['lookup', 'unsafe:lead:key']}], [{result: ['unavailable']}],
  new Response('Unavailable', {status: 503})];
 for (const response of badResults) {
  calls.length = 0;
  respond = () => response;
  assert.deepEqual(await insertLeadWithReceipt(lead(), randomUUID(), fingerprint), {status: 'unavailable'});
  assert.equal(calls.length, 1, 'An ambiguous outcome must never trigger another write');
 }
});

test('a created reply is bound to the server event generated for this request', async () => {
 const item = lead();
 respond = () => [{result: ['created', randomUUID(), item.id]}];
 assert.deepEqual(await insertLeadWithReceipt(item, randomUUID(), fingerprint), {status: 'unavailable'});
});

test('lost response retains memory only; healthy global status is not acceptance proof', async () => {
 respond = created;
 await insertLeadWithReceipt(lead(), randomUUID(), fingerprint);
 assert.equal(storeStatus().backend, 'upstash');
 calls.length = 0;
 const item = lead('network-fallback');
 respond = () => {throw new Error('Response lost after possible commit');};
 assert.deepEqual(await insertLeadWithReceipt(item, randomUUID(), fingerprint), {status: 'unavailable'});
 assert.equal(calls.length, 1);
 assert.deepEqual(await getLead(item.id), item, 'An explicitly non-durable local copy remains available');
});

test('expired or missing original lead during read-only replay produces no receipt', async () => {
 respond = (cmds) => [{result: cmds[0][15] === 'create' ? ['lookup', 'original'] : ['unavailable']}];
 assert.deepEqual(await insertLeadWithReceipt(lead(), randomUUID(), fingerprint), {status: 'unavailable'});
 assert.equal(calls.length, 2);
 assert.equal(calls[1][0][15], 'replay');
});

test('second-round response cannot claim creation or ask for a third request', async () => {
 for (const second of [['created', randomUUID(), 'original'], ['lookup', 'different']]) {
  calls.length = 0;
  respond = (cmds) => [{result: cmds[0][15] === 'create' ? ['lookup', 'original'] : second}];
  assert.deepEqual(await insertLeadWithReceipt(lead(), randomUUID(), fingerprint), {status: 'unavailable'});
  assert.equal(calls.length, 2);
 }
});

test('invalid caller input never sends a Redis command', async () => {
 const item = lead();
 for (const [submission, digest] of [['not-a-uuid', fingerprint], [randomUUID(), 'raw@example.test'], [randomUUID(), 'A'.repeat(64)]]) {
  assert.deepEqual(await insertLeadWithReceipt(item, submission, digest), {status: 'unavailable'});
 }
 assert.deepEqual(await insertLeadWithReceipt(lead('unsafe:key'), randomUUID(), fingerprint), {status: 'unavailable'});
 item.createdAt = Number.MAX_SAFE_INTEGER;
 assert.deepEqual(await insertLeadWithReceipt(item, randomUUID(), fingerprint), {status: 'unavailable'});
 assert.equal(calls.length, 0);
});

test('legacy insertLead remains compatible and never exposes a receipt', async () => {
 respond = (cmds) => cmds.map(() => ({result: 'OK'}));
 assert.equal(await insertLead(lead()), undefined);
 assert.equal(calls[0].length, 6);
 assert.equal(calls[0][0][0], 'SET');
});
