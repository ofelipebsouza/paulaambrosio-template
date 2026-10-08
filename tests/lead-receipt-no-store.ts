import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { buildLead } from '../src/lib/crm/schema';
import { getLead, insertLeadWithReceipt } from '../src/lib/crm/store';

test('missing Redis credentials use memory only and never return a receipt', async () => {
 const originalFetch = globalThis.fetch;
 let calls = 0;
 globalThis.fetch = async () => {calls++; throw new Error('No request is permitted without configured Redis');};
 try {
  const item = buildLead({id: 'no-credentials', now: Date.UTC(2026, 9, 8), form: 'contact', page: '/contact/', payload: {
   name: 'Synthetic fixture', email: 'fixture@example.test', phone: '', location: '', propertyType: '',
   service: '', budget: '', timeline: '', message: 'Synthetic fixture only',
  }});
  assert.deepEqual(await insertLeadWithReceipt(item, randomUUID(), 'a'.repeat(64)), {status: 'unavailable'});
  assert.deepEqual(await getLead(item.id), item);
  assert.equal(calls, 0);
 } finally {
  globalThis.fetch = originalFetch;
 }
});
