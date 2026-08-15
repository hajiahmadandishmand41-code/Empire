/**
 * Prisma seed — General Store (v2).
 *
 * Seeds general store categories (clothing, digital, home appliances,
 * beauty, sports, footwear, baby, books, electronics, watches)
 * and sample products priced in AFN.
 * Safe to re-run: uses upsert on slug/key.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  { key: 'clothing', name: 'پوشاک', slug: 'clothing' },
  { key: 'digital', name: 'دیجیتال', slug: 'digital' },
  { key: 'homeAppliances', name: 'لوازم خانگی', slug: 'home-appliances' },
  { key: 'beauty', name: 'آرایشی و بهداشتی', slug: 'beauty' },
  { key: 'sports', name: 'ورزشی', slug: 'sports' },
  { key: 'footwear', name: 'کفش و کتانی', slug: 'footwear' },
  { key: 'baby', name: 'کودک و نوزاد', slug: 'baby' },
  { key: 'books', name: 'کتاب و لوازم‌التحریر', slug: 'books' },
  { key: 'electronics', name: 'الکترونیک', slug: 'electronics' },
  { key: 'watches', name: 'ساعت و اکسسوری', slug: 'watches' },
];

const PRODUCTS = [
  {
    slug: 'samsung-galaxy-a55',
    name: 'Samsung Galaxy A55',
    shortDescription: 'گوشی هوشمند سامسونگ با دوربین ۵۰ مگاپیکسل و باتری ۵۰۰۰ میلی‌آمپر',
    categoryKey: 'digital',
    price: 25000,
    badge: 'new',
  },
  {
    slug: 'nike-air-max-270',
    name: 'Nike Air Max 270',
    shortDescription: 'کتانی ورزشی نایکی با فناوری Air Max برای راحتی حداکثری',
    categoryKey: 'footwear',
    price: 8500,
    badge: 'best',
  },
  {
    slug: 'lg-washing-machine-7kg',
    name: 'ماشین لباسشویی LG 7kg',
    shortDescription: 'ماشین لباسشویی تاپ‌لود ال‌جی با ظرفیت ۷ کیلوگرم، کنترل هوشمند',
    categoryKey: 'homeAppliances',
    price: 32000,
    badge: 'best',
  },
  {
    slug: 'loreal-revitalift-cream',
    name: 'L\'Oréal Revitalift کرم روز',
    shortDescription: 'کرم روز ضد چروک لورآل با فیلتر UV و هیالورونیک اسید',
    categoryKey: 'beauty',
    price: 3200,
    badge: 'new',
  },
  {
    slug: 'adidas-ultraboost-22',
    name: 'Adidas Ultraboost 22',
    shortDescription: 'کفش دویدن آدیداس با تکنولوژی Boost برای بیشترین انرژی بازگشتی',
    categoryKey: 'sports',
    price: 12000,
    badge: 'sale',
  },
  {
    slug: 'zara-men-linen-shirt',
    name: 'پیراهن کتان مردانه Zara',
    shortDescription: 'پیراهن آستین‌بلند کتان زارا، سبک و راحت برای فصل گرم',
    categoryKey: 'clothing',
    price: 4500,
  },
  {
    slug: 'philips-air-fryer',
    name: 'Philips Air Fryer HD9270',
    shortDescription: 'سرخ‌کن بدون روغن فیلیپس ۷ لیتری با ۷ برنامه خودکار',
    categoryKey: 'homeAppliances',
    price: 18500,
    badge: 'best',
  },
  {
    slug: 'xiaomi-mi-band-8',
    name: 'Xiaomi Mi Band 8',
    shortDescription: 'مچ‌بند هوشمند شیائومی با ۱۶ روز عمر باتری و ردیابی ۱۵۰ ورزش',
    categoryKey: 'watches',
    price: 4800,
    badge: 'new',
  },
  {
    slug: 'pampers-newborn-pack',
    name: 'پوشک نوزاد Pampers Newborn',
    shortDescription: 'پوشک نوزادی پمپرز سایز ۱، ۸۴ عدد در بسته، فوق‌العاده نرم',
    categoryKey: 'baby',
    price: 2200,
  },
  {
    slug: 'sony-wh1000xm5',
    name: 'Sony WH-1000XM5 هدفون',
    shortDescription: 'هدفون بی‌سیم سونی با بهترین حذف نویز دنیا، ۳۰ ساعت باتری',
    categoryKey: 'electronics',
    price: 28000,
    badge: 'best',
  },
];

async function main() {
  const catMap = new Map<string, string>();
  for (const c of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { key: c.key },
      update: { name: c.name, slug: c.slug },
      create: { key: c.key, name: c.name, slug: c.slug },
    });
    catMap.set(c.key, row.id);
  }

  for (const p of PRODUCTS) {
    const categoryId = catMap.get(p.categoryKey);
    if (!categoryId) continue;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        shortDescription: p.shortDescription,
        price: p.price,
        badge: p.badge ?? null,
        categoryId,
      },
      create: {
        slug: p.slug,
        name: p.name,
        shortDescription: p.shortDescription,
        price: p.price,
        currency: 'AFN',
        region: 'AF',
        badge: p.badge ?? null,
        inStock: true,
        categoryId,
        featuresJson: JSON.stringify([
          'محصول اصل با ضمانت معتبر',
          'ارسال سریع به سراسر افغانستان',
          'بازگشت ۷ روزه بدون سوال',
        ]),
        imagesJson: JSON.stringify([{ src: null, alt: p.name }]),
      },
    });
  }

  console.log(
    `Seeded ${CATEGORIES.length} categories and ${PRODUCTS.length} products (AFN).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
