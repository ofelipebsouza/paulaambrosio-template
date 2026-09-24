#!/usr/bin/env node
/**
 * Project image & content control.
 *
 * Layout contract (enforced by `check`):
 *   src/content/projects/<slug>.mdx          one entry per project, no drafts
 *   src/assets/projects/<slug>/NN.ext        source photo (NN = 01..99, ext preserved)
 *   src/assets/projects/<slug>/web/NN.webp   optimized derivative referenced by the MDX
 *
 *   NN/01     = featuredImage (card + hero + OG)
 *   NN/02..NN = gallery, in order
 *
 * Sectored projects (render studies like render-pm) additionally declare `sectors:` and
 * label every gallery item; sector blocks are contiguous and follow the `sectors:` order:
 *   sectors:
 *     - "Club Room"
 *   gallery:
 *     - src: "../../assets/projects/<slug>/web/02.webp"
 *       sector: "Club Room"
 * `import` maps each top-level source subfolder to a sector ("MASTER" -> "Master"); deeper
 * nesting belongs to that sector, so no photo can end up unlabeled.
 *
 * projectType must be one of PROJECT_TYPES; the /projects tabs group them as
 * Residential (Residential, Penthouse) · Commercial (Commercial, Hospitality) · Renders.
 *
 * Commands:
 *   node scripts/projects.mjs sync [slug...]        normalize numbering, optimize webp,
 *                                                   prune unreferenced files, rewrite galleries
 *   node scripts/projects.mjs import <slug> <dir>   copy photos from <dir> (subfolders = sectors),
 *                                                   dedupe, then sync
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
const PROJECT_TYPES = ['Residential', 'Penthouse', 'Commercial', 'Hospitality', 'Renders'];
const pad = (n) => String(n).padStart(2, '0');
const baseOf = (p) => p.replace(/^.*\//, '').replace(/\.webp$/i, '');
const humanSector = (name) =>
  name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

const listProjects = () =>
  fs.readdirSync(CONTENT).filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, ''));

const readMdx = (slug) => fs.readFileSync(path.join(CONTENT, `${slug}.mdx`), 'utf8');

const GALLERY_RE =
  /^gallery:(?:[ \t]*\[\])?[ \t]*\r?\n(?:[ \t]*-[ \t]*(?:"[^"]+"|src:\s*"[^"]+")[ \t]*\r?\n(?:[ \t]+sector:\s*"[^"]+"[ \t]*\r?\n)?)*/m;
const SECTORS_RE =
  /^sectors:(?:[ \t]*\[\])?[ \t]*\r?\n(?:[ \t]*-[ \t]*(?:name:\s*)?"[^"]+"[ \t]*\r?\n(?:[ \t]+images:\s*\d+[ \t]*\r?\n)?|[ \t]*-[ \t]*\{[^\n]*\}[ \t]*\r?\n)*/m;

function parseRefs(mdx) {
  const featured = /featuredImage:\s*"[^"]*\/([^/"]+)"/.exec(mdx)?.[1] ?? null;
  const galleryBlock =
    GALLERY_RE.exec(mdx)?.[0]?.replace(/^gallery:(?:[ \t]*\[\])?[ \t]*\r?\n/, '') ?? '';
  const items = [];
  for (const line of galleryBlock.split(/\r?\n/)) {
    const item = /^[ \t]*-[ \t]*(?:"([^"]+)"|src:\s*"([^"]+)")/.exec(line);
    if (item) {
      items.push({ base: baseOf(item[1] ?? item[2]), sector: 'Others' });
      continue;
    }
    const sector = /^[ \t]+sector:\s*"([^"]+)"/.exec(line);
    if (sector && items.length) items[items.length - 1].sector = sector[1];
  }
  const sectorsBlock =
    SECTORS_RE.exec(mdx)?.[0]?.replace(/^sectors:(?:[ \t]*\[\])?[ \t]*\r?\n/, '') ?? '';
  const sectors = [];
  for (const line of sectorsBlock.split(/\r?\n/)) {
    const name = /^[ \t]*-[ \t]*(?:name:\s*)?"([^"]+)"/.exec(line);
    if (name) sectors.push({ name: name[1], images: 1 });
    const count = /^[ \t]+images:\s*(\d+)/.exec(line);
    if (count && sectors.length) sectors[sectors.length - 1].images = Number(count[1]);
  }
  // Expand contiguous sector slices into per-item labels.
  const labels = [];
  for (const s of sectors) for (let k = 0; k < s.images; k++) labels.push(s.name);
  while (labels.length < items.length) labels.push('Others');
  items.forEach((it, i) => { it.sector = labels[i] ?? 'Others'; });
  return { featured: featured ? baseOf(featured) : null, items, sectors };
}

let currentSlug = '';

function rewriteRefs(mdx, entries) {
  const nl = mdx.includes('\r\n') ? '\r\n' : '\n';
  const gallery = entries.slice(1);
  const galleryLines = gallery.map((e) => `  - "../../assets/projects/${currentSlug}/web/${e.target}.webp"`);
  let out = mdx.replace(
    /featuredImage:\s*"[^"]*"/,
    `featuredImage: "../../assets/projects/${currentSlug}/web/01.webp"`,
  );
  out = out.replace(SECTORS_RE, '');
  // Contiguous sector slices (name + image count) derived from the ordered entries.
  const bands = [];
  for (const e of gallery) {
    const last = bands[bands.length - 1];
    if (last && last.name === e.sector) last.images++;
    else bands.push({ name: e.sector ?? 'Others', images: 1 });
  }
  const sectorList = bands.filter((b) => b.name !== 'Others');
  const sectorsBlock = sectorList.length
    ? `sectors:${nl}${sectorList.map((s) => `  - name: "${s.name}"${nl}    images: ${s.images}`).join(nl)}${nl}`
    : '';
  const galleryText = galleryLines.length
    ? `gallery:${nl}${galleryLines.join(nl)}${nl}`
    : `gallery: []${nl}`;
  const m = GALLERY_RE.exec(out);
  if (!m) throw new Error('gallery block not found');
  return out.slice(0, m.index) + sectorsBlock + galleryText + out.slice(m.index + m[0].length);
}

async function toWebp(srcPath, destPath) {
  await sharp(srcPath).rotate().resize({ width: OPT.width, withoutEnlargement: true }).webp({ quality: OPT.quality }).toFile(destPath);
}

async function sync(slug, { includeAll = false, sectorOf = new Map() } = {}) {
  currentSlug = slug;
  const dir = path.join(ASSETS, slug);
  const webDir = path.join(dir, 'web');
  fs.mkdirSync(webDir, { recursive: true });

  const mdxPath = path.join(CONTENT, `${slug}.mdx`);
  const mdx = readMdx(slug);
  const { featured, items, sectors: declared } = parseRefs(mdx);

  // Sector ranking: declared order first, then source folder order (import), then gallery order.
  const rank = new Map();
  const addRank = (s) => {
    if (s && s !== 'Others' && !rank.has(s)) rank.set(s, rank.size);
  };
  declared.forEach((s) => addRank(s.name));
  for (const s of new Set(sectorOf.values())) addRank(s);
  items.forEach((it) => addRank(it.sector));

  // Order = featured first, then gallery; optionally append unreferenced disk files.
  const order = [];
  const seen = new Set();
  const push = (base, sector) => {
    if (base && !seen.has(base)) {
      seen.add(base);
      order.push({ base, sector: sector ?? 'Others' });
    }
  };
  push(featured, null);
  for (const it of items) push(it.base, it.sector);
  if (includeAll) {
    const disk = new Set();
    for (const f of fs.readdirSync(dir)) if (f !== 'web' && IMG_RE.test(f)) disk.add(f.replace(/\.[^.]+$/, ''));
    for (const f of fs.readdirSync(webDir)) if (IMG_RE.test(f)) disk.add(f.replace(/\.webp$/i, ''));
    const key = (base) => {
      const s = sectorOf.get(base);
      return s && s !== 'Others' && rank.has(s) ? rank.get(s) : rank.size;
    };
    const nameOrder = (a, b) => key(a) - key(b) || (a < b ? -1 : a > b ? 1 : 0);
    for (const base of [...disk].sort(nameOrder)) push(base, sectorOf.get(base));
  }
  if (order.length === 0) throw new Error(`${slug}: nothing referenced and nothing on disk`);

  // Regroup by sector (stable sort): contiguous blocks in rank order, cover stays pinned as 01.
  if (rank.size > 0) {
    const cover = order.shift();
    const key = (e) => (e.sector === 'Others' || !rank.has(e.sector) ? rank.size : rank.get(e.sector));
    order.sort((a, b) => key(a) - key(b));
    order.unshift(cover);
  }

  // Map each entry to its source file (any extension) and current webp, if present.
  const rootFiles = fs.readdirSync(dir).filter((f) => f !== 'web' && IMG_RE.test(f));
  const webFiles = new Set(fs.readdirSync(webDir).filter((f) => IMG_RE.test(f)));
  const findSource = (base) => rootFiles.find((f) => f.replace(/\.[^.]+$/, '').toLowerCase() === base.toLowerCase());

  // Resolve refs to real files; drop stale refs (MDX points at a deleted image).
  const resolved = order
    .map((e) => ({
      ...e,
      src: findSource(e.base),
      web: webFiles.has(`${e.base}.webp`) ? `${e.base}.webp` : null,
    }))
    .filter((s) => s.src || s.web);
  const dropped = order.filter((e) => !resolved.some((r) => r.base === e.base)).map((e) => e.base);
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

  // Phase 4: rewrite MDX refs (featured + gallery + sectors).
  fs.writeFileSync(mdxPath, rewriteRefs(mdx, steps));
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

    const type = /^projectType:\s*"([^"]+)"/m.exec(mdx)?.[1] ?? null;
    if (!type) label('missing projectType');
    else if (!PROJECT_TYPES.includes(type)) label(`projectType "${type}" must be one of ${PROJECT_TYPES.join(', ')}`);
    if (!/^imageAlt:\s*"[^"]+"/m.test(mdx)) label('missing imageAlt');

    const { featured, items, sectors } = parseRefs(mdx);
    if (!featured) label('missing featuredImage');
    const expected = [featured, ...items.map((it) => it.base)].filter(Boolean);
    expected.forEach((base, i) => {
      if (base !== pad(i + 1)) label(`ref #${i + 1} is "${base}", expected "${pad(i + 1)}"`);
    });
    const n = expected.length;
    if (n < 2) label('needs at least a cover (01) and one gallery image');
    if (new Set(expected).size !== n) label('duplicate references');

    // Sector slices must exactly cover the gallery (contiguity is structural).
    const labels = items.map((it) => it.sector);
    if (sectors.length) {
      const total = sectors.reduce((n, s) => n + s.images, 0);
      if (total !== items.length) label(`sectors declare ${total} images but the gallery has ${items.length}`);
      if (labels.some((s) => s === 'Others')) label('sectored project: every gallery image needs a sector');
      if (new Set(sectors.map((s) => s.name)).size !== sectors.length) label('duplicate sector name');
    }

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
    // Source layout: photo files directly in <dir> (flat project) and/or one top-level
    // subfolder per sector (deeper nesting belongs to that sector).
    const found = [];
    const walk = (from, sector) => {
      for (const f of fs.readdirSync(from).sort()) {
        const p = path.join(from, f);
        if (fs.statSync(p).isDirectory()) walk(p, sector ?? humanSector(f));
        else if (IMG_RE.test(f)) found.push({ path: p, name: f, sector: sector ?? 'Others' });
      }
    };
    const top = fs.readdirSync(src);
    for (const f of top.filter((f) => !fs.statSync(path.join(src, f)).isDirectory()).sort()) {
      if (IMG_RE.test(f)) found.push({ path: path.join(src, f), name: f, sector: 'Others' });
    }
    for (const f of top.filter((f) => fs.statSync(path.join(src, f)).isDirectory()).sort()) {
      walk(path.join(src, f), humanSector(f));
    }
    if (!found.length) throw new Error(`${src}: no images found`);
    const sectorOf = new Map();
    let copied = 0, dupes = 0;
    for (const item of found) {
      const hash = crypto.createHash('md5').update(fs.readFileSync(item.path)).digest('hex');
      if (known.has(hash)) { dupes++; continue; }
      known.add(hash);
      let name = item.name;
      while (fs.existsSync(path.join(dir, name))) name = name.replace(/(\.[^.]+)$/, '-x$1');
      fs.copyFileSync(item.path, path.join(dir, name));
      sectorOf.set(name.replace(/\.[^.]+$/, ''), item.sector);
      copied++;
    }
    console.log(`${slug}: copied ${copied} new (${dupes} duplicates skipped)`);
    await sync(slug, { includeAll: true, sectorOf });
  } else if (cmd === 'check') {
    check();
  } else {
    console.log('usage: sync [slug...] | import <slug> <dir> | check');
  }
} catch (e) {
  console.error('✗', e.message);
  process.exit(1);
}
