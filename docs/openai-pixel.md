# OpenAI Pixel and accepted-lead measurement

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
  page URL, or inquiry metadata to OpenAI. A permitted accepted-lead event supplies only
  `lead_created`, `{ type: "customer_action" }`, its opaque `event_id`, and `opt_out: true`. The SDK still receives technical network
  information and its own vendor-managed behavior applies.
- Automatic advanced matching is **not claimed disabled**. The documented SDK
  can detect and hash eligible contact information according to account settings.
  The privacy page discloses this behavior and the absence of verification.
- Only accepted-lead receipts from the contact endpoint can trigger explicit
  `lead_created` calls. No CAPI, account or campaign changes. `opt_out: true` is
  passed in the event options, not invented as an initialization property.
- The current consent is read again at dispatch. Receipts arriving without a
  grant are discarded, never replayed after a later grant. Pending SDK-load
  receipts are dropped on revocation. Up to 100 opaque event IDs are retained
  in tab-scoped session storage while permitted, never contact or form values.

## Verification and rollback

`node --test tests/openai-pixel.test.mjs` runs a mocked SDK/DOM with no network.
Run this alongside contact, Google consent/tracking, product and sitemap tests,
`npm run build`, and `npm run lint`. Do not submit a real lead to test the tag.

Set `PUBLIC_OPENAI_PIXEL_ENABLED=false` and rebuild to disable the bootstrap.
This does not recall data previously transmitted or unload an already-open page.

## Durable acceptance and bounded retries

The form creates a random submission UUID for an unchanged in-page inquiry and
retains it for retry; editing input or starting a new inquiry creates a new UUID.
The server binds the UUID to a SHA-256 fingerprint of the sanitized payload and
form ID. This internal fingerprint is never sent to OpenAI.

An Upstash Redis EVAL script atomically writes the CRM lead/index/counters and a
receipt with a separate server-generated event UUID. A repeated key verifies the
original lead still exists before replaying that receipt. Different payloads with
the same key fail as a conflict. The retry record expires after **seven days**;
replays do not extend it, and after expiry it is a new submission. This is not an
unbounded exactly-once guarantee.

Only the exact acknowledged write/replay result produces the public
`leadAcceptance: { version: 1, eventId }`. Memory fallback, missing credentials,
malformed results and uncertain/failed writes do not. Honeypot and blocked 200
responses stay generic; their absence of a receipt is intentionally distinguishable
from durable acceptance. Validation, verification and rate-limit failures have no
receipt. Legacy clients without a submission UUID retain delivery behavior but
receive no measurement receipt.

An acknowledged receipt survives later automation or SMTP failure. The browser
can measure it from the server's 502/503 response without changing the existing
visible email-fallback UX. A verified replay skips new CRM automation and email.
For unavailable storage, the endpoint retains the previous SMTP availability,
but must not follow the uncertain write with another save/insert. Exactly-once
SMTP delivery during ambiguous concurrent storage outcomes is **not** guaranteed.

## Verification limits

Production Vercel variable names confirm Upstash is configured, not that it is
currently reachable. No credentials were decrypted. Offline tests exercise the
actual browser/form/route code with mocks, REST result behavior, and the actual
Lua script through an installed Lua library with Redis command mocks. Those are
**not** real Redis or live Upstash integration tests. No real lead, contact data,
SMTP message or OpenAI measurement event may be submitted for QA without separate
approval of the test contact and data.

Seeing an event received by OpenAI is separate from attributed ad conversions.
Attribution requires an eligible real ad interaction under the account's window.
Never fabricate an `oppref` or promise attribution from a synthetic event test.

Official references:
- https://developers.openai.com/ads/measurement-pixel
- https://developers.openai.com/ads/supported-events
- https://upstash.com/docs/redis/sdks/ts/commands/scripts/eval
