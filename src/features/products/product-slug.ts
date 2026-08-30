import { createHash } from 'node:crypto';

const MAX_SLUG_LENGTH = 80;
const NON_LATIN_TO_LATIN: Record<string, string> = {
  'ا': 'a', 'آ': 'a', 'أ': 'a', 'إ': 'e', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's', 'ج': 'j', 'چ': 'ch',
  'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's',
  'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ک': 'k', 'ك': 'k', 'گ': 'g',
  'ل': 'l', 'م': 'm', 'ن': 'n', 'و': 'w', 'ؤ': 'w', 'ه': 'h', 'ۀ': 'h', 'ة': 'h', 'ی': 'y', 'ي': 'y',
  'ى': 'y', 'ئ': 'y',
};

function transliterate(input: string): string {
  return Array.from(input.normalize('NFKC'))
    .map((char) => NON_LATIN_TO_LATIN[char] ?? char)
    .join('');
}

export function slugifyProductName(value: string): string {
  const transliterated = transliterate(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');
  return transliterated || 'product';
}

export function deterministicSlugFallback(name: string, categoryId?: string): string {
  const base = slugifyProductName(name);
  const fingerprint = createHash('sha256').update(`${name}\0${categoryId ?? ''}`).digest('hex').slice(0, 10);
  return `${base}-${fingerprint}`.slice(0, MAX_SLUG_LENGTH).replace(/-+$/g, '');
}
