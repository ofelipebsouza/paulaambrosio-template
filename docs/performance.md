# Performance and accessibility

## Implemented baseline

- Phosphor Icons are bundled locally from `@phosphor-icons/web/regular`; the site no longer waits on a third-party icon script from the critical path.
- The first home hero image is eager, responsive, and marked with high fetch priority. Remaining carousel images stay lazy.
- Below-the-fold press images remain lazy and decode asynchronously.
- Self-hosted font files use `font-display: swap`; only the display and body faces needed above the fold are preloaded.
- Scroll-reveal content is progressively enhanced: content remains visible when JavaScript is unavailable, while the existing animation remains available when JavaScript runs.
- Existing `prefers-reduced-motion` rules disable decorative motion for users who request reduced motion.
- Existing semantic landmarks, skip link, visible focus styles, labels, native dialogs, image alt text, and responsive Astro image generation remain in place.

## Validation

The local checks completed for this pass:

- `npm run lint` (`tsc --noEmit`)
- `npm run build` (73 pages generated)
- `git diff --check`
- Generated home HTML inspection confirmed no `unpkg.com` icon script, local Phosphor styles, and `fetchpriority="high"` on the first hero image.

## Lighthouse expectations

A score of 100 cannot be guaranteed from source code alone. Lighthouse varies with browser version, device emulation, network throttling, Vercel region, cache state, third-party analytics response, and production image/CDN behavior. Run Lighthouse against the deployed production URL in an incognito session, then compare mobile and desktop results.

The project still loads Vercel Web Analytics and Speed Insights globally. These are intentionally retained for product measurement and Real User Monitoring; their production network timing should be evaluated in the deployed environment rather than inferred from a local build.

## Recommended production QA

1. Run Lighthouse on `/`, `/projects`, `/contact`, and one project detail page.
2. Check mobile LCP, CLS, and INP after a cold cache.
3. Confirm that the first hero image is the LCP candidate and is served in a responsive modern format.
4. Test keyboard navigation, focus visibility, dialog Escape behavior, reduced motion, and a screen reader pass.
5. Confirm Vercel Analytics and Speed Insights are enabled in the project dashboard before interpreting production data.
