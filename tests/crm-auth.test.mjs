import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { build } from 'esbuild';

async function auth(env) {
  const result = await build({
    stdin: { contents: "export * from './src/lib/crm/auth.ts'; export * from './src/lib/crm/guard.ts';", resolveDir: process.cwd() },
    bundle: true, platform: 'node', format: 'esm', write: false,
    define: { 'import.meta.env': JSON.stringify(env) },
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

test('missing password fails closed, even with a correctly signed derived cookie', async () => {
  const api = await auth({});
  const expiry = String(Math.floor(Date.now() / 1000) + 3600);
  const signature = createHmac('sha256', 'derived:').update(`v1:${expiry}`).digest('hex');
  const token = `${expiry}.${signature}`;
  assert.equal(api.verifySessionToken(token), false);
  const request = new Request('https://fixture.example.test/api/crm/leads/', { headers: { Cookie: `crm_session=${token}` } });
  assert.equal(api.readSession(request), false);
  assert.equal(api.requireCrm(request)?.status, 401);
  assert.throws(() => api.createSessionToken(), /crm_not_configured/);
});

test('removing the password disables old cookies even if the session secret remains', async () => {
  const enabled = await auth({ CRM_PASSWORD: 'fixture-password', CRM_SESSION_SECRET: 'fixture-secret' });
  const disabled = await auth({ CRM_SESSION_SECRET: 'fixture-secret' });
  assert.equal(disabled.verifySessionToken(enabled.createSessionToken()), false);
});

test('configured sessions accept valid cookies, reject tampering and expire on time', async () => {
  const api = await auth({ CRM_PASSWORD: 'fixture-password', CRM_SESSION_SECRET: 'fixture-secret', CRM_SESSION_TTL: '60' });
  const now = 1800000000000;
  const token = api.createSessionToken(now);
  assert.equal(api.verifySessionToken(token, now + 59000), true);
  assert.equal(api.verifySessionToken(token, now + 60000), false);
  assert.equal(api.verifySessionToken(token + '0', now), false);
  assert.equal(api.verifySessionToken('malformed', now), false);
  assert.equal(api.passwordMatches('wrong'), false);
  assert.equal(api.passwordMatches('fixture-password'), true);
  const cookie = api.sessionCookie(token, 'https://fixture.example.test/admin/');
  for (const attribute of ['HttpOnly', 'SameSite=Lax', 'Secure', 'Max-Age=60']) assert.ok(cookie.includes(attribute));
});

test('password-only deployments remain supported without weakening disabled state', async () => {
  const api = await auth({ CRM_PASSWORD: 'fixture-password' });
  const token = api.createSessionToken();
  assert.equal(api.verifySessionToken(token), true);
});
