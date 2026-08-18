// Temporary one-off script: copies EMPIRE_ADMIN_*/EMPIRE_SELLER_* values to the
// new ADMIN_*/SELLER_* env var names in Vercel (Production + Preview + Development),
// without ever printing the values to stdout/stderr. Deleted after use.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const SCOPE = 'team_qQkRtTd3YGdx7RKnS92kVjYB';

function parseEnvFile(path) {
  const raw = readFileSync(path, 'utf8');
  const out = {};
  for (const line of raw.split('\n')) {
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let value = line.slice(idx + 1);
    // Strip surrounding quotes added by `vercel env pull`
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n');
    }
    out[key] = value;
  }
  return out;
}

const prodEnv = parseEnvFile('.env.production.local');

const mapping = [
  ['EMPIRE_ADMIN_EMAIL', 'ADMIN_EMAIL'],
  ['EMPIRE_ADMIN_PASSWORD', 'ADMIN_PASSWORD'],
  ['EMPIRE_ADMIN_NAME', 'ADMIN_NAME'],
  ['EMPIRE_SELLER_EMAIL', 'SELLER_EMAIL'],
  ['EMPIRE_SELLER_PASSWORD', 'SELLER_PASSWORD'],
  ['EMPIRE_SELLER_NAME', 'SELLER_NAME'],
];

const targets = ['production', 'preview', 'development'];

for (const [oldKey, newKey] of mapping) {
  const value = prodEnv[oldKey];
  if (!value) {
    console.log(`[skip] ${oldKey} not found in pulled production env`);
    continue;
  }
  for (const target of targets) {
    const result = spawnSync(
      'npx',
      ['vercel', 'env', 'add', newKey, target, '--scope', SCOPE, '--force'],
      { input: value, encoding: 'utf8' }
    );
    const ok = result.status === 0;
    console.log(`[${ok ? 'ok' : 'FAIL'}] ${newKey} -> ${target}`);
    if (!ok) {
      console.log(result.stderr?.slice(0, 500));
    }
  }
}
