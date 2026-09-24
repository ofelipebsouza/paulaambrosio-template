# Run doc — Paula Ambrosio Interiors (Astro static site)

## Reproduce artifacts (fresh checkout)

1. Install dependencies (npm; `package-lock.json` is committed):

   ```
   npm install
   ```

2. No `.env` files are required. The only optional variable is `CONTACT_FORM_ENDPOINT`
   (routes the contact form to a CRM/webhook; falls back to `mailto:` when unset) —
   copy values from the main checkout only when integrating the form. Never commit secrets.
3. Content lives in `src/content/**` (MDX + Zod schemas in `src/content.config.ts`);
   design tokens in `src/styles/global.css`. Nothing else needs generating.

## Run the dev server

```
npm run dev -- --host 127.0.0.1
```

- Default port **4321** (Astro default; keep it if free, otherwise pass `--port <n>`).
- **Always pass `--host 127.0.0.1`.** Plain `npm run dev` binds `localhost`, which resolves to
  IPv6 `::1` on this machine — the Freebuff preview checker resolves to IPv4 `127.0.0.1`
  (and vice versa), so `register_preview` fails with "did not answer an HTTP request".
  Binding IPv4 explicitly fixes it; register the preview with `http://127.0.0.1:4321/`
  (NOT `http://localhost:4321/`).
- Windows detached start (Freebuff preview recipe), with stdout/stderr in separate files:

  ```
  powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev','--','--host','127.0.0.1' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"

  Note: the PowerShell call may hang the calling shell even though the child starts fine;
  grab the pid from `netstat -ano | findstr :4321` if no Id is printed.
  ```

- Verify: `netstat -ano | findstr :4321` shows LISTENING, `curl http://localhost:4321/` returns 200,
  and `Get-Process -Id <pid>` confirms survival a few seconds later.

## Verify before deploy

```
npm run build          # static output to dist/ (75 pages at last count; takes ~10 min on this disk)
node scripts/check-links.mjs
npx tsc --noEmit
```

Note: `npx astro check` hangs indefinitely in this environment; use `tsc --noEmit` instead.
