# Performance and accessibility

Budget: **LCP < 2,5 s · INP < 200 ms · CLS < 0,1** and Lighthouse 95–100 in all
four categories. Field telemetry comes from Vercel Speed Insights
(see `docs/analytics.md`).

## Implemented baseline

- Phosphor Icons are bundled locally and subsetted to the icons actually used
  (~3 KiB instead of ~147 KiB); the site never waits on a third-party icon script.
- Fonts are self-hosted subsets (`src/styles/fonts.css`) with `font-display: swap`;
  only the display and body faces needed above the fold are preloaded. Loew ships
  as woff2.
- The first hero image is eager, responsive (`srcset`) and marked with high fetch
  priority; the remaining carousel images stay deferred and load on idle.
- Below-the-fold sections use `content-visibility: auto`; press/project images
  remain lazy and decode asynchronously.
- Every image declares `width`/`height` (CLS = 0), including the lightbox.
- Scroll-reveal content is progressively enhanced: content stays visible when
  JavaScript is unavailable, while the animation remains available when it runs.
- Existing `prefers-reduced-motion` rules disable decorative motion for users who
  request reduced motion.
- Semantic landmarks, skip link, visible focus styles, labels, native dialogs,
  image alt text and responsive Astro image generation remain in place.

## Measuring locally

```bash
npm run build                 # build + guard (scripts/check-links.mjs)
node .freebuff/lh-server.mjs  # static server with gzip + Vercel stubs on 4324
npx lighthouse http://127.0.0.1:4324/ \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless=new" --quiet
```

Always **run 3 times and compare medians**: this machine swings ~15 Performance
points between runs (user Chrome + OneDrive), while Accessibility, Best Practices
and SEO stay pinned at 100.

## CSS: why it is NOT inlined (measured, not an opinion)

The "render-blocking requests" insight points at `/_astro/Layout.*.css`
(11.2 KiB compressed, ~57 KiB source). We A/B tested `build.inlineStylesheets:
'always'` on the same build (inlining the CSS into the home page, 3 runs each):

| Median (3 runs) | External CSS | Inlined CSS |
| --------------- | ------------ | ----------- |
| Performance     | **97**       | 84          |
| FCP             | **1 223 ms** | 1 805 ms    |
| TBT             | **145 ms**   | 533 ms      |
| SI              | **1 655 ms** | 2 583 ms    |

Inlining is worse here: the ~57 KiB of CSS would enter the HTML of **every** page
and be parsed on the main thread (TBT ↑) with no cross-page cache, while the
external file is served by the CDN over HTTP/2 with brotli and answers in ~0 ms.
The insight is informational and does not affect the score.

Page scripts (`.astro` inline) are `type="module"` → **deferred by spec**, so they
do not block FCP/LCP; the dependency tree in the report is chunk discovery order,
not the paint-critical path.

## Validation

- `npm run lint` (`tsc --noEmit`)
- `npm run build` (80 pages) — the build now also runs `scripts/check-links.mjs`
- `npx lighthouse` on `/`, `/contact/`, `/interior-design-miami/` and two journal
  articles: Accessibility, Best Practices and SEO at **100**; Performance 96–98 on
  this machine, with the noise explained above.

## Lighthouse expectations

A score of 100 cannot be guaranteed from source code alone. Lighthouse varies with
browser version, device emulation, network throttling, Vercel region, cache state,
third-party analytics response, and production image/CDN behavior. Run Lighthouse
against the deployed production URL in an incognito session, then compare mobile
and desktop results.

The project still loads Vercel Web Analytics and Speed Insights globally. These are
intentionally retained for product measurement and Real User Monitoring; their
production network timing should be evaluated in the deployed environment rather
than inferred from a local build.

## Recommended production QA

1. Run Lighthouse on `/`, `/projects/`, `/contact/` and one project detail page.
2. Check mobile LCP, CLS and INP after a cold cache.
3. Confirm the first hero image is the LCP candidate and is served in a responsive
   modern format.
4. Test keyboard navigation, focus visibility, dialog Escape behavior, reduced
   motion, and a screen reader pass.
5. Confirm Vercel Analytics and Speed Insights are enabled in the project dashboard
   before interpreting production data.
