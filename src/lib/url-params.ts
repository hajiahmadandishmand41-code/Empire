/**
 * Route parameters arrive percent-encoded (e.g. Persian/Pashto storefront
 * slugs like %D9%81%D8%B1%D9%88%D8%B4%DA%AF%D8%A7%D9%87). Decode them before
 * database lookups; malformed sequences fall back to the raw value.
 */
export function decodeRouteParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
