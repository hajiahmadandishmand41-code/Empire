import type { ShippingAddress } from './order';

export type UserRole = 'guest' | 'customer' | 'admin';

export interface User {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  role: UserRole;
  defaultAddress?: ShippingAddress;
  createdAt?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}
