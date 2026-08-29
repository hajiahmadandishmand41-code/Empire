import { z } from 'zod';

const INTERNAL_MEDIA_PATH = /^\/api\/media\/[A-Za-z0-9_-]{8,80}$/;

export function isAllowedAdminMediaUrl(value: string): boolean {
  const normalized = value.trim();
  if (INTERNAL_MEDIA_PATH.test(normalized)) return true;
  try {
    const url = new URL(normalized);
    return (url.protocol === 'https:' || url.protocol === 'http:') && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export const adminMediaUrlSchema = z
  .string()
  .trim()
  .max(1000)
  .refine(isAllowedAdminMediaUrl, 'Invalid media URL');

export function isInternalMediaUrl(value: string): boolean {
  return INTERNAL_MEDIA_PATH.test(value.trim());
}
