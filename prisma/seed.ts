/**
 * Prisma seed — General Store (v3).
 * Safe to re-run: uses upsert on slug/key.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  { key: 'clothing', name: 'پوشاک', slug: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80' },
  { key: 'digital', name: 'دیجیتال', slug: 'digital', imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80' },
  { key: 'homeAppliances', name: 'لوازم خانگی', slug: 'home-appliances', imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80' },
  { key: 'beauty', name: 'آرایشی و بهداشتی', slug: 'beauty', imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80' },
  { key: 'sports', name: 'ورزشی', slug: 'sports', imageUrl: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=900&q=80' },
  { key: 'footwear', name: 'کفش و کتانی', slug: 'footwear', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80' },
  { key: 'baby', name: 'کودک و نوزاد', slug: 'baby', imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=900&q=80' },
  { key: 'books', name: 'کتاب و لوازم‌التحریر', slug: 'books', imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80' },
  { key: 'electronics', name: 'الکترونیک', slug: 'electronics', imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=80' },
  { key: 'watches', name: 'ساعت و اکسسوری', slug: 'watches', imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80' },
];

const PRODUCTS = [
  ['samsung-galaxy-a55', 'Samsung Galaxy A55', 'گوشی هوشمند سامسونگ با نمایشگر AMOLED و دوربین حرفه‌ای', 'digital', 25000, 'new', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=85'],
  ['nike-air-max-270', 'Nike Air Max 270', 'کتانی روزمره و ورزشی با زیره Air Max', 'footwear', 8500, 'best', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85'],
  ['lg-washing-machine-7kg', 'LG Washing Machine 7kg', 'ماشین لباسشویی ال‌جی برای استفاده خانگی', 'homeAppliances', 32000, 'best', 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=1200&q=85'],
  ['loreal-revitalift-cream', 'L’Oréal Revitalift Cream', 'کرم روز مراقبت از پوست با بافت سبک', 'beauty', 3200, 'new', 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=85'],
  ['adidas-ultraboost-22', 'Adidas Ultraboost 22', 'کفش دویدن راحت برای استفاده روزانه و ورزش', 'sports', 12000, 'sale', 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=1200&q=85'],
  ['zara-men-linen-shirt', 'پیراهن کتان مردانه Zara', 'پیراهن سبک کتان برای فصل گرم', 'clothing', 4500, null, 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=85'],
  ['xiaomi-mi-band-8', 'Xiaomi Mi Band 8', 'مچ‌بند هوشمند با پایش فعالیت روزانه', 'watches', 4800, 'new', 'https://images.unsplash.com/photo-1557935728-e6d1eaabe558?auto=format&fit=crop&w=1200&q=85'],
  ['sony-wh1000xm5', 'Sony WH-1000XM5', 'هدفون بی‌سیم با حذف نویز فعال', 'electronics', 28000, 'best', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85'],
  ['pampers-newborn-pack', 'Pampers Newborn Pack', 'پوشک نوزاد برای استفاده روزانه', 'baby', 2200, null, 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1200&q=85'],
  ['modern-business-book', 'کتاب راهنمای کسب‌وکار مدرن', 'کتاب نمونه برای تست دسته کتاب و جستجو', 'books', 1400, null, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1200&q=85'],
] as const;

async function main() {
  const catMap = new Map<string, string>();
  for (const c of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { key: c.key },
      update: { name: c.name, slug: c.slug },
      create: { key: c.key, name: c.name, slug: c.slug },
    });
    catMap.set(c.key, row.id);
    await prisma.$executeRawUnsafe('UPDATE "Category" SET "imageUrl" = $1 WHERE "id" = $2', c.imageUrl, row.id).catch(() => undefined);
  }

  for (const [slug, name, shortDescription, categoryKey, price, badge, image] of PRODUCTS) {
    const categoryId = catMap.get(categoryKey);
    if (!categoryId) continue;
    await prisma.product.upsert({
      where: { slug },
      update: { name, shortDescription, price, badge: badge ?? null, categoryId, imagesJson: [{ src: image, alt: name }] },
      create: {
        slug, name, shortDescription, price, currency: 'AFN', region: 'AF', badge: badge ?? null,
        inStock: true, isActive: true, stockQuantity: 20, categoryId,
        featuresJson: ['محصول اصل با ضمانت معتبر', 'ارسال سریع به سراسر افغانستان', 'بازگشت ۷ روزه بدون سوال'],
        imagesJson: [{ src: image, alt: name }],
      },
    });
  }

  console.log(`Seeded ${CATEGORIES.length} categories and ${PRODUCTS.length} products with images.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
