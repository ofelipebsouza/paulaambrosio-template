import type { APIRoute } from 'astro';
import sharp from 'sharp';
import path from 'node:path';

// Preserve the complete supplied promotional artwork, without cropping its type.
export const GET: APIRoute = async () => {
  const body = await sharp(path.resolve('src/assets/vice-city/share-artwork.webp'))
    .resize(1200, 630, { fit: 'contain', background: '#f9f5f0' })
    .jpeg({ quality: 90 })
    .toBuffer();
  return new Response(new Uint8Array(body), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' },
  });
};
