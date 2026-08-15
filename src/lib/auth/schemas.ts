import { z } from 'zod';
import { isValidAfghanPhone, toE164AfghanPhone } from '@/lib/validation/phone';

const fullName = z
  .string()
  .trim()
  .min(2, 'نام باید حداقل ۲ کاراکتر باشد')
  .max(80, 'نام طولانی است');

const password = z
  .string()
  .min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد')
  .max(128, 'رمز عبور طولانی است');

const emailOrPhone = z.string().trim().min(3, 'ایمیل یا شماره موبایل الزامی است').max(120);

export interface Identifier {
  email: string | null;
  phone: string | null;
}

export function parseIdentifier(value: string): Identifier | null {
  const v = value.trim();
  if (!v) return null;
  if (v.includes('@')) {
    const email = z.string().email().safeParse(v);
    if (!email.success) return null;
    return { email: email.data.toLowerCase(), phone: null };
  }
  if (isValidAfghanPhone(v)) {
    return { email: null, phone: toE164AfghanPhone(v) };
  }
  return null;
}

export const registerSchema = z
  .object({
    fullName,
    identifier: emailOrPhone,
    password,
    confirmPassword: password,
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'رمز عبور و تکرار آن یکسان نیستند',
  });

export const loginSchema = z.object({
  identifier: emailOrPhone,
  password: z.string().min(1, 'رمز عبور الزامی است'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
