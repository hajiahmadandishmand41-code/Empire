import { prisma } from '../src/lib/db';

const iterations = Math.max(3, Math.min(50, Number(process.env.DB_BENCHMARK_ITERATIONS || 10)));
const results: Array<{ name: string; ms: number }> = [];

async function measure(name: string, fn: () => Promise<unknown>) {
  const started = performance.now();
  await fn();
  results.push({ name, ms: performance.now() - started });
}

if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.SUPABASE_DB_URL) {
  console.error('DATABASE_URL (or a supported Postgres variable) is required.');
  process.exit(1);
}

try {
  await prisma.$queryRaw`SELECT 1`;
  for (let i = 0; i < iterations; i++) {
    await measure('product:list', () => prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 24,
      select: { id: true, slug: true, price: true, createdAt: true },
    }));
    await measure('product:popular', () => prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ salesCount: 'desc' }, { id: 'desc' }],
      take: 24,
      select: { id: true, salesCount: true },
    }));
    await measure('category:active-count', () => prisma.category.count({ where: { isActive: true } }));
  }

  const grouped = new Map<string, number[]>();
  for (const row of results) grouped.set(row.name, [...(grouped.get(row.name) ?? []), row.ms]);
  const percentile = (values: number[], p: number) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
  };

  for (const [name, values] of grouped) {
    console.log(JSON.stringify({
      query: name,
      iterations: values.length,
      p50Ms: Number(percentile(values, 0.5).toFixed(2)),
      p95Ms: Number(percentile(values, 0.95).toFixed(2)),
      maxMs: Number(Math.max(...values).toFixed(2)),
    }));
  }
} finally {
  await prisma.$disconnect();
}
