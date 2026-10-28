import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Preserve the merchant's complete triptych, including its actual labels.
export const GET: APIRoute = async () => {
  const image = await readFile(path.resolve('public/images/home-essence/collection.jpg'));
  const body = await sharp(image).resize(1200, 630, { fit: 'contain', background: '#f9f5f0' }).jpeg({ quality: 90 }).toBuffer();
  return new Response(new Uint8Array(body), { headers: { 'Content-Type':'image/jpeg', 'Cache-Control':'public, max-age=86400' } });
};
