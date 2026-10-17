/** Real-browser regression suite; all API calls are mocked and external requests blocked.
 * Run: node tests/contact-browser.test.mjs
 * Requires local Chromium and the preinstalled Playwright runtime (override with env vars).
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
const playwright = await import(process.env.PLAYWRIGHT_MODULE || '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js');
const { chromium } = playwright.default ?? playwright;
const base = process.env.CONTACT_BROWSER_BASE || 'http://127.0.0.1:4322';
const origin = new URL(base);
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname), 'Only a local test server is allowed');
const root = fileURLToPath(new URL('../', import.meta.url));
let server;
let serverLog = '';
let browser;
const screenshots = [];
try {
  if (!process.env.CONTACT_BROWSER_BASE) {
    server = spawn(process.execPath, ['--input-type=module', '--eval', `import { dev } from 'astro'; await dev({ server: { host: '127.0.0.1', port: ${Number(origin.port)} } });`], {
      cwd: root, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    server.stdout.on('data', chunk => { serverLog += chunk; });
    server.stderr.on('data', chunk => { serverLog += chunk; });
  }
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server?.exitCode !== null && server?.exitCode !== undefined) throw new Error(`Astro exited: ${serverLog}`);
    try { if ((await fetch(`${base}/contact/`)).ok) { ready = true; break; } } catch {}
    await delay(500);
  }
  assert.ok(ready, `Local Astro server did not become ready: ${serverLog}`);
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  for (const viewport of [{ width: 1440, height: 1000, name: 'desktop' }, { width: 390, height: 844, name: 'mobile' }]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, serviceWorkers: 'block' });
    const pageErrors = [];
    const unexpectedAPIs = [];
    const blockedExternal = [];
    const submissions = [];
    let responseMode = 'validation';
    await context.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin !== origin.origin) {
        blockedExternal.push(url.hostname);
        return route.abort('blockedbyclient');
      }
      if (url.pathname === '/api/contact/') {
        assert.equal(request.method(), 'POST');
        submissions.push({ body: request.postData(), id: request.headers()['x-submission-id'] });
        if (responseMode === 'validation') return route.fulfill({ status: 422, json: { ok: false, errors: { unknown_server_field: 'Unsupported field.', message: 'Please describe your project.' } } });
        if (responseMode === 'unavailable') return route.fulfill({ status: 503, json: { ok: false, error: 'delivery_unavailable' } });
        return route.fulfill({ status: 200, json: { ok: true, leadAcceptance: { version: 1, eventId: '12345678-1234-4123-8123-123456789abc' } } });
      }
      if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_vercel/')) {
        if (!url.pathname.startsWith('/api/analytics/') && !url.pathname.startsWith('/_vercel/')) unexpectedAPIs.push(url.pathname);
        return request.resourceType() === 'script'
          ? route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* Analytics disabled in browser regression tests. */' })
          : route.fulfill({ status: 200, json: { ok: true } });
      }
      // Only local static assets and dev-server modules may reach the server.
      if (!['GET', 'HEAD'].includes(request.method())) {
        unexpectedAPIs.push(`${request.method()} ${url.pathname}`);
        return route.abort('blockedbyclient');
      }
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(`${base}/contact/`, { waitUntil: 'networkidle' });
    await page.locator('form[data-analytics-form="contact"][data-analytics-bound="true"]').waitFor();
    for (const kind of ['contact', 'project_inquiry']) {
      const form = page.locator(`form[data-analytics-form="${kind}"]`);
      const modal = page.locator('#inquiry-modal');
      const openModal = async () => {
        const trigger = page.locator('.inquiry-open').first();
        if (await trigger.isVisible()) await trigger.click();
        else await trigger.evaluate(button => button.click()); // Header intentionally hides this trigger on desktop.
        await modal.waitFor({ state: 'visible' });
      };
      if (kind === 'project_inquiry') await openModal();
      const name = form.locator('[name="name"]');
      const email = form.locator('[name="email"]');
      const message = form.locator('[name="message"]');
      const status = form.locator('.analytics-form-status');
      const submit = form.locator('button[type="submit"]');
      await name.fill('Synthetic Browser Test');
      await email.fill('browser-test@example.test');
      await form.locator('[name="phone"]').fill('5550100999');
      if (kind === 'contact') {
        for (const field of ['location', 'propertyType', 'service', 'budget', 'timeline']) await form.locator(`[name="${field}"]`).selectOption({ index: 1 });
      }
      const initial = await form.evaluate(el => Object.fromEntries(new FormData(el)));
      const previousCount = submissions.length;
      await submit.click();
      assert.equal(await message.evaluate(el => el.validity.valueMissing), true, `${viewport.name}/${kind}: native required message`);
      assert.equal(await message.evaluate(el => el === document.activeElement), true);
      assert.equal(submissions.length, previousCount, 'Native validation must prevent API request');
      await message.fill('Synthetic project details for local testing only.');
      responseMode = 'validation';
      await submit.click();
      await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('aria-invalid') === 'true', `form[data-analytics-form="${kind}"] [name="message"]`);
      assert.equal(await message.evaluate(el => el === document.activeElement), true, 'Focus first known field even when unknown key is first');
      assert.match(await status.textContent(), /Please describe your project/);
      const descriptions = (await message.getAttribute('aria-describedby')).split(/\s+/);
      assert.ok(descriptions.length);
      assert.ok(await message.evaluate(el => el.getAttribute('aria-describedby').split(/\s+/).some(id => document.getElementById(id)?.textContent.includes('Please describe your project.'))));
      for (const [key, value] of Object.entries(initial)) {
        if (key !== 'message') assert.equal(await form.locator(`[name="${key}"]`).first().inputValue(), value, `${key} preserved after 422`);
      }
      const errorPath = `/tmp/paula-${viewport.name}-${kind}-validation.png`;
      await page.screenshot({ path: errorPath, fullPage: kind === 'contact' }); screenshots.push(errorPath);
      await message.fill('Updated synthetic project details.');
      assert.equal(await message.getAttribute('aria-invalid'), null);
      assert.equal(await form.locator(`[id^="${kind}-error-"]`).count(), 0, 'Dynamic field errors removed');
      assert.equal(await status.textContent(), '', 'Editing clears stale validation summary');
      if (kind === 'project_inquiry') {
        assert.equal(await message.getAttribute('aria-describedby'), 'inq-message-error', 'Preserve static accessibility description');
        await page.keyboard.press('Escape');
        assert.equal(await modal.evaluate(el => el.open), false);
        await openModal();
        assert.equal(await message.inputValue(), 'Updated synthetic project details.', 'Close/reopen retains unfinished inquiry');
      }
      responseMode = 'unavailable';
      await submit.click();
      await status.getByRole('link', { name: 'Open email draft' }).waitFor();
      assert.equal(await message.inputValue(), 'Updated synthetic project details.');
      assert.equal(await name.inputValue(), 'Synthetic Browser Test');
      assert.equal(await submit.isEnabled(), true);
      const failedSubmission = submissions.at(-1);
      responseMode = 'accepted';
      await submit.click();
      await page.waitForFunction(selector => document.querySelector(selector)?.textContent.includes('Thank you.'), `form[data-analytics-form="${kind}"] .analytics-form-status`);
      assert.ok(failedSubmission.id, 'Retry key is generated');
      assert.equal(submissions.at(-1).id, failedSubmission.id, 'Unchanged retry retains submission ID');
      for (const field of ['name', 'email', 'phone', 'message']) assert.equal(await form.locator(`[name="${field}"]`).inputValue(), '', `${field} reset after accepted 200`);
      if (kind === 'contact') for (const field of ['location', 'propertyType', 'service', 'budget', 'timeline']) assert.equal(await form.locator(`[name="${field}"]`).inputValue(), '');
      assert.equal(await form.locator('[aria-invalid="true"]').count(), 0);
      assert.equal(await submit.isEnabled(), true);
      assert.equal(await form.getAttribute('aria-busy'), 'false');
      assert.equal(submissions.length, previousCount + 3, 'Only 422, 503 and accepted 200 submissions');
      const successPath = `/tmp/paula-${viewport.name}-${kind}-success.png`;
      await page.screenshot({ path: successPath, fullPage: kind === 'contact' }); screenshots.push(successPath);
      if (kind === 'project_inquiry') {
        await modal.getByRole('button', { name: 'Close inquiry form' }).click();
        await openModal();
        assert.equal(await message.inputValue(), '');
        await page.keyboard.press('Escape');
      }
      console.log(`PASS ${viewport.name}/${kind}: native validation, 422 focus/preservation, editing cleanup, 503 retry, accepted 200 reset${kind === 'project_inquiry' ? ', modal close/reopen' : ''}`);
    }
    assert.deepEqual(pageErrors, [], 'No uncaught browser errors');
    assert.deepEqual(unexpectedAPIs, [], 'No unexpected API writes');
    console.log(`${viewport.name}: ${submissions.length} mocked submissions; blocked external hosts: ${[...new Set(blockedExternal)].join(', ') || '(none requested)'}`);
    await context.close();
  }
  console.log(`Screenshots: ${screenshots.join(', ')}`);
} finally {
  await browser?.close();
  server?.kill('SIGTERM');
}
