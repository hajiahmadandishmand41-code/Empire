/**
 * Server-side validation schemas for orders.
 *
 * Prices, names and totals are deliberately NOT accepted as trusted input.
 * The order service re-reads all product and shipping data from PostgreSQL.
 */
import { z } from 'zod';

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(32),
  province: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80),
  city: z.string().trim().max(80).optional(),
  addressLine: z.string().trim().min(4).max(300),
  postalCode: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(500).optional(),
  label: z.string().trim().max(60).optional(),
});

export const cartLineSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  quantity: z.number().int().positive().max(999),
});

export const orderDraftSchema = z
  .object({
    items: z.array(cartLineSchema).min(1).max(200),
    address: shippingAddressSchema.optional(),
    addressId: z.string().trim().min(1).optional(),
    paymentMethod: z.enum(['cod', 'bank_transfer', 'whatsapp', 'atoma_pay']).default('cod'),
    shippingMethodId: z.string().trim().min(1).optional(),
    shippingMethodKey: z.enum(['standard', 'express', 'cod']).optional(),
    // Kept optional for backwards-compatible clients. It is never trusted for pricing.
    summary: z
      .object({
        itemCount: z.number().int().nonnegative().optional(),
        subtotal: z.number().finite().nonnegative().optional(),
        currency: z.enum(['USD', 'AFN', 'EUR']).optional(),
      })
      .optional(),
  })
  .refine((v) => !!v.addressId || !!v.address, {
    message: 'Either addressId or address is required',
    path: ['address'],
  })
  .refine((v) => new Set(v.items.map((item) => item.slug)).size === v.items.length, {
    message: 'Duplicate products are not allowed in an order',
    path: ['items'],
  });

export type OrderDraftInput = z.infer<typeof orderDraftSchema>;

/** New/edit saved address on the customer profile. */
export const addressInputSchema = shippingAddressSchema.extend({
  isDefault: z.boolean().optional().default(false),
});
export type AddressInput = z.infer<typeof addressInputSchema>;

/** Admin shipping-method create/update. */
export const shippingMethodInputSchema = z.object({
  key: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(400).optional(),
  kind: z.enum(['standard', 'express', 'cod']).default('standard'),
  cost: z.number().finite().nonnegative(),
  currency: z.enum(['USD', 'AFN', 'EUR']).default('USD'),
  etaDays: z.number().int().nonnegative().max(90).optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});
export type ShippingMethodInput = z.infer<typeof shippingMethodInputSchema>;
