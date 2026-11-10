# Checkout release readiness

Prepared on 2026-11-06. This change is a draft for review, not a launch approval.
All destination configuration is build-time: rebuild after a change. Links render
publicly in HTML; never put credentials or private tokens in these settings.

| Page | Provider / price | Current behavior and release requirement |
| --- | --- | --- |
| Change Order | Hotmart / US$27; optional US$9.99, bundle US$36.99 | Existing `CHANGE_ORDER_CHECKOUT_URL` and `CHANGE_ORDER_BUNDLE_CHECKOUT_URL` are independent. Missing/invalid selected offer remains interest-only. Obtain and verify both exact offers and final PT/EN deliverables. |
| HOST UP | Hotmart / R$49 | New `HOST_UP_CHECKOUT_URL`, blank by default. Only a valid direct `https://pay.hotmart.com/<offer>` enables purchase, price and matching FAQ. Verify final contents, files, price and access before setting it. |
| Home Essence | Stripe / US$47.90 | Existing Payment Link and price were recorded as verified on 2026-10-29 in `src/data/home-essence.ts`. Unset `HOME_ESSENCE_CHECKOUT_URL` retains that offer; explicitly blank or invalid disables both CTAs and removes the structured-data offer. A replacement must be a verified `https://buy.stripe.com/<link>` for the same offer. |

## Before enabling sales

- Hotmart: owner must confirm the offers, final downloadable files, included
  languages/materials, access and displayed prices. Do not use marketplace pages
  or invent an offer ID. Change Order must not send bundle selection to base-only checkout.
- Stripe: reconfirm active link, merchant, USD47.90 amount, exact bottle/presentation,
  inventory availability, destination coverage, shipping/tax charges, delivery and
  fulfillment process in the merchant account. These were not revalidated by this change.
  Existing copy asks customers to confirm product and shipping details with Paula.
- Stripe payment is completed on Stripe's hosted checkout, reached from the site;
  no Shopify dependency. This is not an embedded card form or a new payment backend.
  No webhook, order system or successful-payment assertion is added.
- Review desktop/mobile pages and checkout destinations without completing a real
  payment. Verify delivery with approved test-mode workflows before launch.
- Review and approve the draft PR separately from deployment. No production
  environment values, account settings or paid files are changed in this PR.

## Validation

Run `node --test tests/product-checkout.test.mjs tests/change-order-checkout.test.mjs
tests/home-essence.test.mjs tests/product-landings.test.mjs`, then `npm run build`
and `npm run lint`. Test blank and invalid configuration as well as local fixture
URLs; never navigate to fixture offers. Existing advertising consent behavior and
Change Order tracking opt-in stay unchanged. A checkout click is not a purchase.
