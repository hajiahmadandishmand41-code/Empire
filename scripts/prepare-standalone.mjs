#!/usr/bin/env node
/**
 * Next.js standalone output intentionally excludes public/ and static assets.
 * Copy them beside the generated server so standalone production runs serve
 * the same application assets as `next start`.
 */
import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

// Vercel produces its own serverless build output (no `.next/standalone`),
// so this step is a no-op there.
if (process.env.VERCEL) {
  console.log('Vercel build detected — skipping standalone asset preparation.');
  process.exit(0);
}

const root = process.cwd();
const standalone = resolve(root, '.next/standalone');

await mkdir(resolve(standalone, '.next'), { recursive: true });
await cp(resolve(root, 'public'), resolve(standalone, 'public'), { recursive: true });
await cp(resolve(root, '.next/static'), resolve(standalone, '.next/static'), { recursive: true });

console.log('Standalone assets prepared.');