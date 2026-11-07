# Vice City landing page

Draft route: `/vice-city/`. English PDF, US$3.99, one-time purchase via Stan Store.
This branch is for review only. Do not merge or deploy without the owner's approval.

## Current state

- Uses the existing site layout, official colors and fonts, and consent controls.
- Uses the supplied Vice City promotional artwork and HOME A&A photography already
  in the studio portfolio. Captions distinguish illustrative artwork from a real
  completed project. No game assets or paid PDF pages are included.
- Copy covers the confirmed outline: palettes, materials, lighting, layouts and a
  buying plan. The completed English PDF has eight pages, room-by-room ideas and an illustrative
  budget. No testimonials, delivery timing or refund promises are made.
- Both purchase buttons are disabled. No checkout URL or public PDF download is
  supplied. A disabled button cannot send a visitor to a placeholder checkout.
- Listed only in the materials group on `/links/`; global navigation is unchanged.
- `noindex, follow`, excluded from the XML sitemap, consistent with existing
  advertising product landings. No crawl block is added.

## Before opening sales

1. Review the final PDF with Paula. Check that all five topic descriptions remain
   accurate, replace preparation wording only as appropriate, and confirm imagery.
2. Upload the approved PDF to the intended Stan Store product. Verify its seller,
   exact title, USD 3.99 one-time price, taxes/fees if applicable, delivery and refund
   terms. Do not publish the paid PDF in this repository or the site's public assets.
3. Obtain the verified direct product URL, shaped like
   `https://stan.store/<seller>/p/<product>`. Set `checkoutUrl` and `readyForSale: true`
   together in `src/data/vice-city.mjs`. The validator checks only the URL shape;
   it cannot confirm the seller, file, price or terms. If Stan returns a different
   official URL format, verify it before adapting the validator and tests.
4. Update the default-state regression test after approval. Test both CTA links in
   mobile and desktop layouts, the actual product page, the final total and delivery
   setup. Do not make a real purchase as a test without authorization.
5. Run `npm run lint`, `node --test tests/vice-city.test.mjs`, `npm run sitemap:test`,
   and `npm run build` (includes tracking-safety tests and the full link guard).
   Then run `node --test tests/vice-city-build.test.mjs` for compiled HTML checks.
6. Keep the PR draft until the owner approves the guide, checkout and page.

No new lead-capture form, customer data collection or purchase/conversion event
was added. Existing site analytics remain under the shared layout's controls.

## Verification on this branch

- `npm run astro -- sync`, then `npm run lint`: passed.
- New source/checkout tests, existing product-landing and Home Essence tests: 12 passed.
- Sitemap policy tests: 4 passed.
- Production build: passed, including 23 existing tracking-safety tests and the
  guard over 105 pages. Three pre-existing missing-schema informational notes
  remain on `/change-order/`, `/host-up/` and `/layout-starter-kit/`.
- Compiled-page checks: 3 passed (metadata, disabled checkout, image paths, ARIA
  references, section anchors and FAQ markup).
- Real-browser layout and interaction QA is **not verified** in this environment.
  The local Chromium launch failed because its socket operation was not permitted.
  The cloud browser could not reach the localhost preview; it also disallowed an
  offline data URL. Review desktop and phone layouts in the normal preview before
  approval. No screenshot or visual-pass claim is supplied.
- No live payment or delivery test has been performed. Checkout remains disabled.
