# Vice City landing page

Route: `/vice-city/`. English PDF, US$5.99, one-time purchase via Stan Store.
The sales activation PR is for review only. Do not merge or deploy without the
owner's approval.

## Current state

- Uses the existing site layout, official colors and fonts, and consent controls.
- Uses the supplied Vice City promotional artwork and HOME A&A photography already
  in the studio portfolio. Captions distinguish illustrative artwork from a real
  completed project. No game assets or paid PDF pages are included.
- Copy covers palettes, materials, lighting, layouts and a buying plan. The English
  PDF has eight pages, room-by-room ideas and an illustrative budget. No testimonials,
  delivery timing or refund promises are made.
- Both purchase CTAs use the verified direct Stan Store product URL:
  `https://stan.store/Paulaambrosio_/p/miami-style-made-simple?lang=en`.
  `readyForSale` is `true`; the price remains US$5.99.
- The existing URL guard still fails closed for unfinished products, invalid URLs,
  storefronts, non-HTTPS URLs and off-platform links. It checks URL shape only;
  it cannot verify the seller, file, price or terms.
- Listed only in the materials group on `/links/`; global navigation is unchanged.
- `noindex, follow`, excluded from the XML sitemap, consistent with existing
  advertising product landings. No crawl block is added.

## Launch evidence — 2026-11-10

The owner requested activation of infoproduct sales. According to the task's
confirmed history, Paula tested this guide, completed a purchase and received it;
the delivered file was subsequently checked and confirmed correct.
The public product page was checked on 2026-11-10 in the parent task: **Vice Miami
Interior Style Guide**, **US$5.99**, with Stripe card checkout, Google Pay and
PayPal displayed. This records supplied verification, not a new purchase made
while implementing this change. Payment methods can vary with browser/device.

The approved PDF stays on the delivery platform; it is not added to this repository
or public site assets. No payment integration, credentials, other product,
lead-capture form or purchase/conversion event is changed. Existing site analytics
remain under the shared layout's controls.

## Validation and release

Run `npm run astro -- sync`, `npm run lint`,
`node --test tests/vice-city.test.mjs tests/product-landings.test.mjs tests/home-essence.test.mjs`,
`npm run sitemap:test`, and `npm run build` (includes tracking-safety tests and the
full link guard). Then run `node --test tests/vice-city-build.test.mjs`.

The source regression checks the exact approved URL, including `?lang=en`, and the
existing fail-closed cases. Compiled-page tests check both live CTA links, purchase
guidance, price consistency, metadata, images, ARIA references, FAQ and discovery.
Review desktop and phone layouts in a local preview and record results in the PR.
No new real purchase is needed for this code change.

Keep the PR draft until review. Merge and deployment require separate instruction.
To suspend sales later, set `readyForSale: false`; the existing component will render
both disabled buttons and the unavailable-sales explanation.

### Results for sales activation

- Astro sync and TypeScript lint: passed.
- Product/source regressions: 12 passed; sitemap policy: 4 passed.
- Build: passed, including 23 tracking-safety tests and the guard over 106 pages
  and 99 sitemap URLs. Existing informational missing-JSON-LD notes remain on
  `/change-order/`, `/host-up/` and `/layout-starter-kit/`.
- Compiled-page checks: 4 passed, including both exact checkout destinations.
- `git diff --check`: passed.
- Visual/interactive preview QA remains unverified: local Chromium failed at
  startup with `socket() failed: Operation not permitted`; the cloud browser
  returned `ERR_CONNECTION_REFUSED` for localhost. No screenshot or visual-pass
  claim is supplied. Desktop/mobile interaction review remains for an accessible
  preview. No real purchase was attempted during this implementation.
