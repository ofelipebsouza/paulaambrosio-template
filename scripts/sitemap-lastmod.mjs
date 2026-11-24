import { readdirSync, readFileSync } from 'node:fs';

const journalRoot = new URL('../src/content/journal/', import.meta.url);
const changedRoutes = new Map([
  '/', '/services/', '/about/', '/contact/', '/links/', '/one-park-tower-interior-design/',
  '/bellini-bal-harbour-interior-design/', '/penthouse-interior-design-miami-beach/',
  '/rivage-bal-harbour-interior-design/', '/interior-design-miami/', '/interior-designer-bal-harbour/',
  '/interior-designer-north-miami/', '/interior-designer-bay-harbor-islands/',
  '/interior-designer-key-biscayne/', '/spaces/', '/spaces/kitchen/', '/spaces/primary-bedroom/',
  '/spaces/bathroom/', '/spaces/closet/', '/spaces/game-room/', '/spaces/home-theater/',
  '/spaces/laundry-room/', '/spaces/living-room/', '/millwork/', '/design-express-miami/',
  '/design-consultation-miami/', '/hospitality-interior-design-miami/',
  '/luxury-residential-interior-design-miami/', '/condo-renovation-interior-design-miami/',
  '/turnkey-interior-design-miami/', '/projects/home-aa/', '/projects/hillsboro-beach-penthouse/',
  '/projects/render-commercial-dafne/', '/projects/render-commercial-ec-salon/',
].map((route) => [route, '2026-11-23']));

const journalDates = new Map(readdirSync(journalRoot)
  .filter((file) => /\.mdx?$/.test(file))
  .flatMap((file) => {
    const source = readFileSync(new URL(file, journalRoot), 'utf8');
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    const date = frontmatter.match(/^updatedDate:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1]
      ?? frontmatter.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1];
    return date ? [[`/journal/${file.replace(/\.mdx?$/, '')}/`, date]] : [];
  }));

/** Use a significant content update or publication date, never the build time. */
export function applySitemapLastmod(item) {
  const path = new URL(item.url).pathname;
  const date = journalDates.get(path) ?? changedRoutes.get(path);
  return date ? { ...item, lastmod: date } : item;
}
