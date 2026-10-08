# OpenAI base Pixel

The base tag is installed from the shared layout. It is independent of GTM and
uses Pixel `DLYetutJXaTeayWo2pLYiF` for ad account
`adacct_6a8c8d289734819d8ba2a3a2d2edfd93`. These IDs are public identifiers, not keys.

## Scope and data flow

- The local bootstrap makes no network request. Only a valid, current Advertising
  measurement choice permits the SDK request on `www.paulaambrosio.com`.
- No SDK request on previews, admin/API pages, absent/denied/unreadable preferences.
- Initialization queues denial first, then the Pixel ID with `debug: false`, then
  permission. Script initialization is guarded once per document. The script
  request's referrer is origin-only.
- Revocation denies the SDK, discards pending queued grants, removes an in-flight
  script, and clears its first-party attribution cookies. Re-enabling requires a
  fresh document. Expiry, storage changes and restored pages recheck consent.
- No site code passes contact values, hashes, user objects, messages, budget,
  page URL, or event data to OpenAI. The SDK still receives technical network
  information and its own vendor-managed behavior applies.
- Automatic advanced matching is **not claimed disabled**. The documented SDK
  can detect and hash eligible contact information according to account settings.
  The privacy page discloses this behavior and the absence of verification.
- No `measure` calls, no `lead_created`, no CAPI, no account or campaign changes.
  `opt_out` is an event option, not a documented initialization option. Because
  this release sends no explicit events, it does not invent an init property.
  A later authorized event integration must use `opt_out: true` while personalized
  advertising remains disabled in the site's choices.

## Verification and rollback

`node --test tests/openai-pixel.test.mjs` runs a mocked SDK/DOM with no network.
Run this alongside contact, Google consent/tracking, product and sitemap tests,
`npm run build`, and `npm run lint`. Do not submit a real lead to test the tag.

Set `PUBLIC_OPENAI_PIXEL_ENABLED=false` and rebuild to disable the bootstrap.
This does not recall data previously transmitted or unload an already-open page.

## Lead measurement is a separate, unresolved task

Do not convert HTTP 200 or `form_success` into a lead event. Honeypot and blocked
requests intentionally return the same success response. A durable CRM write can
precede SMTP failure, and current storage can fall back to ephemeral memory.
The current endpoint has no durable acceptance receipt or retry idempotency.
Introducing a browser-readable acceptance marker also creates an anti-abuse
observability tradeoff. None of these contracts is changed in this base release.

Official reference: https://developers.openai.com/ads/measurement-pixel
