export interface ProductImportRow {
  slug: string;
  name: string;
  shortDescription: string;
  description?: string;
  price: number;
  compareAtPrice?: number | null;
  categoryId: string;
  region: string;
  currency: string;
  inStock: boolean;
  isActive: boolean;
  stockQuantity: number;
  whatsappNumber?: string | null;
  videoUrl?: string | null;
  isTraditional: boolean;
  weightKg?: number | null;
  dimensionsJson?: string | null;
  tagsJson?: string | null;
  attributesJson?: string | null;
}

function parseBoolean(raw: string, fallback: boolean): boolean {
  const value = raw.trim().toLowerCase();
  if (!value) return fallback;
  if (['1', 'true', 'yes', 'y', 'بله', 'بلی'].includes(value)) return true;
  if (['0', 'false', 'no', 'n', 'خیر'].includes(value)) return false;
  throw new Error(`Invalid boolean value: ${raw}`);
}

function parseNumber(raw: string, field: string, row: number): number {
  const value = Number(raw.trim());
  if (!Number.isFinite(value)) throw new Error(`Row ${row}: ${field} must be a number`);
  return value;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (quoted) throw new Error('CSV contains an unterminated quoted field');
  cells.push(current);
  return cells;
}

export function parseProductCsv(text: string, maxRows = 10000): ProductImportRow[] {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length < 2) throw new Error('CSV must contain a header row and at least one product row');
  if (lines.length - 1 > maxRows) throw new Error(`CSV cannot contain more than ${maxRows} products per import`);

  const headers = parseCsvLine(lines[0]).map((value) => value.trim());
  const required = ['slug', 'name', 'shortDescription', 'price', 'categoryId'];
  const missing = required.filter((key) => !headers.includes(key));
  if (missing.length) throw new Error(`Missing required columns: ${missing.join(', ')}`);

  const rows: ProductImportRow[] = [];
  const seen = new Set<string>();
  for (let index = 1; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const cells = parseCsvLine(lines[index]);
    const record = Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex] ?? '']));
    const slug = String(record.slug ?? '').trim();
    const name = String(record.name ?? '').trim();
    const shortDescription = String(record.shortDescription ?? '').trim();
    const categoryId = String(record.categoryId ?? '').trim();
    if (!slug || !name || !shortDescription || !categoryId) throw new Error(`Row ${lineNumber}: required value is empty`);
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Row ${lineNumber}: slug must contain lowercase letters, numbers and hyphens only`);
    if (seen.has(slug)) throw new Error(`Duplicate slug in CSV: ${slug}`);
    seen.add(slug);

    const price = parseNumber(String(record.price ?? ''), 'price', lineNumber);
    const stockQuantity = parseNumber(String(record.stockQuantity ?? '0'), 'stockQuantity', lineNumber);
    if (price <= 0) throw new Error(`Row ${lineNumber}: price must be greater than zero`);
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) throw new Error(`Row ${lineNumber}: stockQuantity must be a non-negative integer`);

    const compareAtRaw = String(record.compareAtPrice ?? '').trim();
    const weightRaw = String(record.weightKg ?? '').trim();
    rows.push({
      slug,
      name,
      shortDescription,
      description: String(record.description ?? '').trim() || undefined,
      price,
      compareAtPrice: compareAtRaw ? parseNumber(compareAtRaw, 'compareAtPrice', lineNumber) : null,
      categoryId,
      region: String(record.region ?? 'AF').trim() || 'AF',
      currency: (String(record.currency ?? 'AFN').trim() || 'AFN').toUpperCase(),
      inStock: parseBoolean(String(record.inStock ?? 'true'), true),
      isActive: parseBoolean(String(record.isActive ?? 'true'), true),
      stockQuantity,
      whatsappNumber: String(record.whatsappNumber ?? '').trim() || null,
      videoUrl: String(record.videoUrl ?? '').trim() || null,
      isTraditional: parseBoolean(String(record.isTraditional ?? 'false'), false),
      weightKg: weightRaw ? parseNumber(weightRaw, 'weightKg', lineNumber) : null,
      dimensionsJson: String(record.dimensionsJson ?? '').trim() || null,
      tagsJson: String(record.tagsJson ?? '').trim() || null,
      attributesJson: String(record.attributesJson ?? '').trim() || null,
    });
  }
  return rows;
}
