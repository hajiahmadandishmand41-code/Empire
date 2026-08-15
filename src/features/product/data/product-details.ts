import { Star, Sun, Leaf, Sparkles, type LucideIcon } from 'lucide-react';
import { shopProducts, type ShopProduct } from '@/features/shop/data/products';

/**
 * Product details layer — Phase 4.
 *
 * The shop catalog (`shopProducts`) stays the single source of
 * truth for the product list. This module enriches each product
 * with detail-page-only content:
 *   - Long-form `description` paragraphs
 *   - `features` bullet list
 *   - `gallery` — 4 placeholder "photos" (icon + gradient),
 *     one of which is the hero and three variations.
 *
 * All content is fully in-memory — no API, no backend.
 */

export interface ProductGalleryItem {
  Icon: LucideIcon;
  accent: ShopProduct['accent'];
}

export interface ProductDetail extends ShopProduct {
  sellerWhatsapp?: string | null;
  description: string[];
  features: string[];
  gallery: ProductGalleryItem[];
}

/** Build a 4-item placeholder gallery for a given product. */
function buildGallery(product: ShopProduct): ProductGalleryItem[] {
  const { accent, Icon } = product;
  const altIcons: LucideIcon[] = [Star, Sun, Leaf, Sparkles];
  const alt1 = altIcons[product.slug.length % altIcons.length]!;
  const alt2 = altIcons[(product.slug.length + 1) % altIcons.length]!;
  const alt3 = altIcons[(product.slug.length + 2) % altIcons.length]!;

  return [
    { Icon, accent },
    { Icon: alt1, accent: { from: accent.to, via: accent.via, to: accent.from } },
    { Icon: alt2, accent: { from: accent.from, via: 'via-cream', to: accent.to } },
    {
      Icon: alt3,
      accent: { from: 'from-navy-800', via: accent.via ?? accent.from, to: accent.to },
    },
  ];
}

function buildFeatures(product: ShopProduct): string[] {
  return [
    `Handcrafted by artisans in ${product.region}, Afghanistan.`,
    'Ethically sourced with fair pay for the makers.',
    'Free worldwide shipping — dispatched within 3 business days.',
    '30-day return guarantee, no questions asked.',
  ];
}

function buildDescription(product: ShopProduct): string[] {
  return [
    `${product.name} — ${product.shortDescription} Every piece in this collection is chosen for its craftsmanship, provenance and cultural depth.`,
    `Made in ${product.region}, this product carries generations of Afghan craft heritage. From material selection to final finishing, each step is done by hand to preserve authenticity and quality.`,
  ];
}

export function toProductDetail(product: ShopProduct): ProductDetail {
  return {
    ...product,
    description: buildDescription(product),
    features: buildFeatures(product),
    gallery: buildGallery(product),
  };
}

export function getProductBySlug(slug: string): ProductDetail | undefined {
  const base = shopProducts.find((p) => p.slug === slug);
  return base ? toProductDetail(base) : undefined;
}

/**
 * Related products — always up to `limit` items. Prefers same
 * category (excluding current slug) then falls back to others.
 */
export function getRelatedProducts(slug: string, limit = 4): ShopProduct[] {
  const current = shopProducts.find((p) => p.slug === slug);
  if (!current) return shopProducts.slice(0, limit);

  const sameCategory = shopProducts.filter(
    (p) => p.slug !== slug && p.categoryKey === current.categoryKey,
  );
  const others = shopProducts.filter(
    (p) => p.slug !== slug && p.categoryKey !== current.categoryKey,
  );

  return [...sameCategory, ...others].slice(0, limit);
}

export function getAllProductSlugs(): string[] {
  return shopProducts.map((p) => p.slug);
}
