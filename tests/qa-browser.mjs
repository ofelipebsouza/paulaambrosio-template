import playwright from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js';
const { chromium } = playwright;
import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:4321';
const now = Date.now();
const makeLead = (i, temperature = ['hot','warm','cold','spam'][i % 4]) => ({
  id: `fixture-${i}`, name: `Synthetic Contact ${i}`, email: `fixture-${i}@example.test`, phone: '',
  message: `Synthetic message ${i}`, form: 'contact', page: '/contact/', status: i % 2 ? 'novo' : 'atendimento_humano',
  createdAt: now - i * 3600000, firstResponseAt: i === 1 ? now - 1000 : null, responded: i === 1,
  flags: [], notes: [], events: [], budget: i % 3 ? 'medium' : '', timeline: i % 2 ? 'soon' : '',
  jev: i === 5 ? null : { score: 0.5, temperature, projectType: 'residential', budgetFit: 'medium', urgency: i % 3 === 0 ? 1 : 0.5, at: now },
});
const leads = Array.from({ length: 22 }, (_, i) => makeLead(i + 1));
leads[0].responded = false; leads[0].firstResponseAt = null;
const tasks = [{ id: 'task-fixture', leadId: 'fixture-1', title: 'Synthetic follow-up', dueAt: now - 3600000, state: 'open' }];
let patchMode = 'ok';
let patchBodies = [];
let taskPatchBodies = [];
const errors = [], requests = [];

const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
for (const viewport of [{ width: 1440, height: 1000, name: 'desktop' }, { width: 390, height: 844, name: 'mobile' }]) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', r => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
  await page.route('**/api/crm/**', async route => {
    const req = route.request(); requests.push(`${req.method()} ${new URL(req.url()).pathname}`);
    const u = new URL(req.url()), method = req.method();
    if (u.pathname === '/api/crm/session/' && method === 'POST') return route.continue();
    if (u.pathname === '/api/crm/session/') return route.fulfill({ json: { ok: true, authenticated: true } });
    if (u.pathname === '/api/crm/leads/' && method === 'GET') return route.fulfill({ json: { ok: true, leads, total: leads.length } });
    if (u.pathname.startsWith('/api/crm/leads/') && method === 'GET') {
      const lead = leads.find(x => x.id === u.pathname.split('/').at(-2)) ?? leads[0];
      return route.fulfill({ json: { ok: true, lead, events: [], tasks: [] } });
    }
    if (u.pathname.startsWith('/api/crm/leads/') && method === 'PATCH') {
      patchBodies.push(JSON.parse(req.postData() || '{}'));
      if (patchMode === 'fail') return route.fulfill({ status: 500, json: { ok: false, error: 'fixture_failure' } });
      const body = patchBodies.at(-1); Object.assign(leads[0], body); if (body.responded) leads[0].firstResponseAt = now;
      return route.fulfill({ json: { ok: true, lead: leads[0] } });
    }
    if (u.pathname === '/api/crm/tasks/' && method === 'PATCH') {
      if (patchMode === 'fail') return route.fulfill({ status: 500, json: { ok: false } });
      taskPatchBodies.push(JSON.parse(req.postData() || '{}')); tasks[0].state = taskPatchBodies.at(-1).state;
      return route.fulfill({ json: { ok: true } });
    }
    if (u.pathname === '/api/crm/tasks/') return route.fulfill({ json: { ok: true, tasks, overdue: tasks.filter(t => t.state === 'open').length } });
    if (u.pathname === '/api/crm/analytics/') return route.fulfill({ json: { ok: true, metrics: {} } });
    if (u.pathname === '/api/crm/metrics/') return route.fulfill({ json: { ok: true, metrics: { tasksOpen: tasks.filter(t => t.state === 'open').length, tasksOverdue: tasks.filter(t => t.state === 'open').length, total: leads.length } } });
    if (u.pathname === '/api/crm/report/') return route.fulfill({ json: { ok: true, report: {} } });
    return route.fulfill({ json: { ok: true, leads, total: leads.length } });
  });
  await page.goto(`${base}/admin/login/`);
  await page.locator('#crm-password').fill('fixture-pass');
  await page.locator('#crm-login').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await page.waitForTimeout(100);
  await page.goto(`${base}/admin/`);
  await page.waitForSelector('#crm-board [data-card="fixture-1"]');
  assert.equal(await page.locator('[data-card]').count(), 22, `${viewport.name}: 22 cards`);
  assert.equal(await page.locator('#crm-queue-overdue').textContent(), '1');
  await page.screenshot({ path: `/tmp/crm-${viewport.name}.png`, fullPage: true });

  await page.locator('#crm-board [data-card="fixture-1"]').locator('p').first().click();
  await page.locator('#crm-lead-dialog').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#crm-lead-dialog').evaluate(el => el.open), true, `${viewport.name}: dialog open`);
  assert.match(await page.locator('#crm-dialog-name').textContent(), /Synthetic Contact 1/);
  assert.match(await page.locator('#crm-dialog-message').textContent(), /Synthetic message 1/);
  assert.match(await page.locator('#crm-dialog-jev').textContent(), /Interesse|Explorando/);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#crm-lead-dialog').evaluate(el => el.open), false, `${viewport.name}: escape close`);

  patchMode = 'fail';
  await page.locator('#crm-board [data-card="fixture-1"] p').first().click();
  await page.locator('#crm-dialog-responded').click();
  await page.waitForTimeout(150);
  assert.match(await page.locator('#crm-status-line').textContent(), /could not be saved/i);
  patchMode = 'ok';
  await page.locator('#crm-dialog-responded').click();
  await page.waitForTimeout(150);
  assert.equal(leads[0].responded, true, `${viewport.name}: lead becomes replied`);
  assert.ok(patchBodies.length >= 2, `${viewport.name}: PATCH fail + success`);
  await page.locator('#crm-lead-dialog').evaluate(el => el.close());
  await page.locator('#crm-refresh').click();
  await page.waitForTimeout(150);
  assert.equal(await page.locator('#crm-queue-overdue').textContent(), '1');
  const beforeTask = requests.length;
  await page.locator('[data-task-done="task-fixture"]').click();
  await page.waitForTimeout(150);
  assert.equal(tasks[0].state, 'done'); assert.ok(requests.length > beforeTask);
  assert.equal(await page.locator('#crm-queue-overdue').textContent(), '0');
  patchMode = 'fail'; tasks[0].state = 'open';
  await page.locator('#crm-refresh').click(); await page.waitForTimeout(100);
  await page.locator('[data-task-done="task-fixture"]').click(); await page.waitForTimeout(100);
  assert.equal(tasks[0].state, 'open', `${viewport.name}: failed task PATCH preserves pending`);
  patchMode = 'ok';
  assert.ok(requests.some(x => x.includes('/api/crm/leads/')));
  for (const id of ['tab-btn-crm', 'tab-btn-journal', 'tab-btn-analytics']) assert.equal(await page.locator(`#${id}`).count(), 1);
  await page.locator('#tab-btn-journal').click(); assert.equal(await page.locator('#section-journal').isVisible(), true); assert.equal(await page.locator('#section-crm').isVisible(), false);
  await page.locator('#tab-btn-analytics').click(); assert.equal(await page.locator('#section-analytics').isVisible(), true); assert.equal(await page.locator('#section-journal').isVisible(), false);
  await page.locator('#tab-btn-crm').click(); assert.equal(await page.locator('#section-crm').isVisible(), true); assert.equal(await page.locator('#section-analytics').isVisible(), false);
  await context.close();
}
assert.equal(errors.filter(e => e.startsWith('pageerror:') || e.startsWith('requestfailed:')).length, 0, `browser errors: ${errors.join('; ')}`);
assert.ok(errors.filter(e => e.includes('500 (Internal Server Error)')).length >= 2, 'intentional PATCH 500 was observed');
await browser.close();
console.log('QA browser passed: desktop + mobile, cards, modal/Escape, JEV, PATCH 500/200, refresh, tabs, screenshots');
