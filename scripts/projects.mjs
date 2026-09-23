#!/usr/bin/env node
/**
 * Project image & content control.
 *
 * Layout contract (enforced by `check`):
 *   src/content/projects/<slug>.mdx          one entry per project, no drafts
 *   src/assets/projects/<slug>/NN.ext        source photo (NN = 01..99, ext preserved)
 *   src/assets/projects/<slug>/web/NN.webp   optimized derivative referenced by the MDX
 *
 *   NN/01  = featuredImage (card + hero + OG)
 *   NN/02..NN = gallery, in order
 *
 * Commands:
 *   node scripts/projects.mjs sync [slug...]        normalize numbering, optimize webp,
 *                                                   prune unreferenced files, rewrite galleries
 *   node scripts/projects.mjs import <slug> <dir>   copy photos from <dir>, dedupe, then sync
 *   node scripts/projects.mjs check                 validate everything; exit 1 on violation
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, 'src/content/projects');
const ASSETS = path.join(ROOT, 'src/assets/projects');
const OPT = { width: 1800, quality: 82 };
const IMG_RE = /\.(jpe?g|png|avif|webp)$/i;
const pad = (n) => String(n).padStart(2, '0');

const listProjects = () =>
  fs.readdirSync(CONTENT).filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, ''));

const readMdx = (slug) => fs.readFileSync(path.join(CONTENT, `${slug}.mdx`), 'utf8');

function parseRefs(mdx) {
  const featured = /featuredImage:\s*"[^"]*\/([^/"]+)"/.exec(mdx)?.[1]?.replace(/\.webp$/i, '') ?? null;
  const galleryBlock = /gallery:\r?\n((?:\s*-\s*"[^"]+"\r?\n)*)/.exec(mdx)?.[1] ?? '';
  const gallery = [...galleryBlock.matchAll(/"[^"]*\/([^/"]+)"/g)].map((m) => m[1].replace(/\.webp$/i, ''));
  return { featured, gallery };
}

function rewriteRefs(mdx, count) {
  const nl = mdx.includes('\r\n') ? '\r\n' : '\n';
  const featuredPath = '../../assets/projects/%SLUG%/web/01.webp';
  const galleryPaths = Array.from({ length: count - 1 }, (_, i) =>
    `  - "../../assets/projects/%SLUG%/web/${pad(i + 2)}.webp"`);
  let out = mdx.replace(/featuredImage:\s*"[^"]*"/, `featuredImage: "${featuredPath}"`);
  const start = out.indexOf(`gallery:${nl}`);
  if (start === -1) throw new Error('gallery block not found');
  const after = out.slice(start);
  const end = after.indexOf(`${nl}---`);
  out = out.slice(0, start) + `gallery:${nl}` + galleryPaths.join(nl) + after.slice(end);
  return out.replaceAll('%SLUG%', currentSlug);
}

let currentSlug = '';

async function toWebp(srcPath, destPath) {
  await sharp(srcPath).rotate().resize({ width: OPT.width, withoutEnlargement: true }).webp({ quality: OPT.quality }).toFile(destPath);
}

async function sync(slug, { includeAll = false } = {}) {
  currentSlug = slug;
  const dir = path.join(ASSETS, slug);
  const webDir = path.join(dir, 'web');
  fs.mkdirSync(webDir, { recursive: true });

  const mdxPath = path.join(CONTENT, `${slug}.mdx`);
  const mdx = readMdx(slug);
  const { featured, gallery } = parseRefs(mdx);

  // Order = featured first, then gallery; optionally append unreferenced disk files.
  const order = [];
  const seen = new Set();
  const push = (base) => { if (base && !seen.has(base)) { seen.add(base); order.push(base); } };
  push(featured);
  gallery.forEach(push);
  if (includeAll) {
    for (const f of fs.readdirSync(dir)) {
      if (f !== 'web' && IMG_RE.test(f)) push(f.replace(/\.[^.]+$/, ''));
    }
    for (const f of fs.readdirSync(webDir)) {
      if (IMG_RE.test(f)) push(f.replace(/\.[^.]+$/, ''));
    }
  }
  if (order.length === 0) throw new Error(`${slug}: nothing referenced and nothing on disk`);

  // Map each entry to its source file (any extension) and current webp, if present.
  const rootFiles = fs.readdirSync(dir).filter((f) => f !== 'web' && IMG_RE.test(f));
  const webFiles = new Set(fs.readdirSync(webDir).filter((f) => IMG_RE.test(f)));
  const findSource = (base) => rootFiles.find((f) => f.replace(/\.[^.]+$/, '').toLowerCase() === base.toLowerCase());

  // Resolve refs to real files; drop stale refs (MDX points at a deleted image).
  const resolved = order
    .map((base) => ({
      base,
      src: findSource(base),
      web: webFiles.has(`${base}.webp`) ? `${base}.webp` : null,
    }))
    .filter((s) => s.src || s.web);
  const dropped = order.filter((base) => !resolved.some((r) => r.base === base));
  if (dropped.length) console.log(`  dropped ${dropped.length} stale ref(s): ${dropped.join(', ')}`);
  if (resolved.length === 0) throw new Error(`${slug}: no referenced images exist on disk`);

  // Phase 1: rename to temp names to avoid collisions (e.g. 1 -> 02 while 02 exists).
  const steps = resolved;
  steps.forEach((s, i) => { s.target = pad(i + 1); });

  const tmpSuffix = '.tmp-renaming';
  for (const s of steps) {
    if (s.src) fs.renameSync(path.join(dir, s.src), path.join(dir, s.target + tmpSuffix));
    if (s.web) fs.renameSync(path.join(webDir, s.web), path.join(webDir, s.target + tmpSuffix));
  }
  // Phase 2: finalize names + (re)generate webp from source when available.
  for (const s of steps) {
    const ext = s.src ? path.extname(s.src).toLowerCase() : '.webp';
    const finalSrc = s.target + ext;
    const finalWeb = `${s.target}.webp`;
    if (s.src) {
      fs.renameSync(path.join(dir, s.target + tmpSuffix), path.join(dir, finalSrc));
      await toWebp(path.join(dir, finalSrc), path.join(webDir, finalWeb));
      if (s.web) fs.rmSync(path.join(webDir, s.target + tmpSuffix), { force: true });
    } else if (s.web) {
      // webp-only entry (source lost): keep the webp as the record.
      fs.renameSync(path.join(webDir, s.target + tmpSuffix), path.join(webDir, finalWeb));
    }
    s.finalSrc = s.src ? finalSrc : null;
    s.finalWeb = finalWeb;
  }

  // Phase 3: prune everything that is not part of the ordered set.
  const keepSrc = new Set(steps.map((s) => s.finalSrc).filter(Boolean));
  const keepWeb = new Set(steps.map((s) => s.finalWeb));
  for (const f of fs.readdirSync(dir)) {
    if (f === 'web' || !IMG_RE.test(f)) continue;
    if (!keepSrc.has(f)) fs.rmSync(path.join(dir, f), { force: true });
  }
  for (const f of fs.readdirSync(webDir)) {
    if (IMG_RE.test(f) && !keepWeb.has(f)) fs.rmSync(path.join(webDir, f), { force: true });
  }

  // Phase 4: rewrite MDX refs (featured + gallery).
  fs.writeFileSync(mdxPath, rewriteRefs(mdx, steps.length));
  const missing = steps.filter((s) => !s.src).length;
  console.log(`  ${steps.length} images 01..${pad(steps.length)}${missing ? `  (${missing} webp-only)` : ''}`);
}

function check() {
  const errors = [];
  const content = listProjects();
  const dirs = fs.readdirSync(ASSETS).filter((d) => fs.statSync(path.join(ASSETS, d)).isDirectory());

  for (const slug of content) {
    const dir = path.join(ASSETS, slug);
    const webDir = path.join(dir, 'web');
    const label = (m) => errors.push(`${slug}: ${m}`);
    if (!fs.existsSync(dir)) { label('missing assets directory'); continue; }

    const mdx = readMdx(slug);
    if (/^draft:\s*true/m.test(mdx)) label('draft: true is not allowed (publish or delete)');

    const { featured, gallery } = parseRefs(mdx);
    const expected = [featured, ...gallery].filter(Boolean);
    expected.forEach((base, i) => {
      if (base !== pad(i + 1)) label(`ref #${i + 1} is "${base}", expected "${pad(i + 1)}"`);
    });
    const n = expected.length;
    if (n < 2) label('needs at least a cover (01) and one gallery image');
    if (new Set(expected).size !== n) label('duplicate references');

    const rootFiles = fs.readdirSync(dir).filter((f) => f !== 'web');
    const webFiles = fs.existsSync(webDir) ? fs.readdirSync(webDir) : [];
    for (const base of expected) {
      if (!webFiles.includes(`${base}.webp`)) label(`ref ${base} has no web/${base}.webp`);
    }
    for (const f of rootFiles) {
      if (!IMG_RE.test(f)) { label(`unexpected file ${f}`); continue; }
      if (!/^\d{2}\.(jpe?g|png|avif)$/i.test(f)) { label(`source not named NN.ext: ${f}`); continue; }
      const base = f.replace(/\.[^.]+$/, '');
      if (!expected.includes(base)) label(`source not referenced by MDX: ${f}`);
      if (!webFiles.includes(`${base}.webp`)) label(`source without web/${base}.webp`);
    }
    for (const f of webFiles) {
      if (!/^\d{2}\.webp$/i.test(f)) { label(`webp not named NN.webp: ${f}`); continue; }
      const base = f.replace(/\.webp$/i, '');
      if (!expected.includes(base)) label(`orphan webp: web/${f}`);
    }
  }
  for (const dir of dirs) {
    if (!content.includes(dir)) errors.push(`${dir}: assets directory without MDX entry`);
  }

  if (errors.length) {
    console.error(`✗ ${errors.length} problem(s):`);
    errors.forEach((e) => console.error('  -', e));
    process.exit(1);
  }
  const total = content.reduce((n, slug) => {
    const web = path.join(ASSETS, slug, 'web');
    return n + (fs.existsSync(web) ? fs.readdirSync(web).length : 0);
  }, 0);
  console.log(`✓ ${content.length} projects, ${total} optimized images, layout contract OK`);
}

const [cmd, ...args] = process.argv.slice(2);
try {
  if (cmd === 'sync') {
    for (const slug of args.length ? args : listProjects()) { console.log(slug); await sync(slug); }
    check();
  } else if (cmd === 'import') {
    const [slug, src] = args;
    if (!slug || !src) throw new Error('usage: import <slug> <source-dir>');
    const dir = path.join(ASSETS, slug);
    fs.mkdirSync(dir, { recursive: true });
    const known = new Set();
    for (const d of [dir, path.join(dir, 'web')]) {
      if (!fs.existsSync(d)) continue;
      for (const f of fs.readdirSync(d)) {
        if (IMG_RE.test(f) && fs.statSync(path.join(d, f)).isFile()) {
          known.add(crypto.createHash('md5').update(fs.readFileSync(path.join(d, f))).digest('hex'));
        }
      }
    }
    let copied = 0, dupes = 0;
    for (const f of fs.readdirSync(src).sort()) {
      const p = path.join(src, f);
      if (!IMG_RE.test(f) || !fs.statSync(p).isFile()) continue;
      const hash = crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');
      if (known.has(hash)) { dupes++; continue; }
      known.add(hash);
      fs.copyFileSync(p, path.join(dir, f));
      copied++;
    }
    console.log(`${slug}: copied ${copied} new (${dupes} duplicates skipped)`);
    await sync(slug, { includeAll: true });
  } else if (cmd === 'check') {
    check();
  } else {
    console.log('usage: sync [slug...] | import <slug> <dir> | check');
  }
} catch (e) {
  console.error('✗', e.message);
  process.exit(1);
}
