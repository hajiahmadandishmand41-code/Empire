#!/usr/bin/env node

/**
 * Stage 1 architecture contract.
 * Fails fast if Prisma stops being the sole authoritative database layer.
 * This is intentionally static and read-only: it does not mutate application data.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const failures = [];

const allDeps = {
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.devDependencies ?? {}),
};

if (allDeps['drizzle-orm'] || allDeps['drizzle-kit']) {
  failures.push('Drizzle runtime/tooling must not be a database dependency; Prisma is the authoritative ORM.');
}

const dbEntry = fs.readFileSync(path.join(root, 'src/lib/db.ts'), 'utf8');
if (!dbEntry.includes("@prisma/client")) {
  failures.push('src/lib/db.ts must initialize the Prisma client.');
}

const schema = fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8');
if (!schema.includes('provider = "postgresql"')) {
  failures.push('Prisma schema must remain PostgreSQL-backed.');
}
if (!schema.includes('generator client')) {
  failures.push('Prisma client generator is missing.');
}

const sourceRoot = path.join(root, 'src');
const legacyImports = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name === 'node_modules' || name.name === '.next') continue;
    const file = path.join(dir, name.name);
    if (name.isDirectory()) walk(file);
    else if (/\.(ts|tsx|js|jsx)$/.test(name.name)) {
      const text = fs.readFileSync(file, 'utf8');
      if (/from\s+['"]drizzle-orm(?:\/|['"])/.test(text) || /require\(['"]drizzle-orm/.test(text)) {
        legacyImports.push(path.relative(root, file));
      }
    }
  }
}
walk(sourceRoot);

if (legacyImports.length) {
  failures.push(`Drizzle runtime imports found in application source: ${legacyImports.join(', ')}`);
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  databaseAuthority: 'Prisma + PostgreSQL',
  drizzleRuntimeImports: 0,
}, null, 2));
