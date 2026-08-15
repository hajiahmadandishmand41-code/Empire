import { db } from './index';
import {
  sellers,
  storeProfiles,
  categories,
  products,
  orders,
  orderItems,
  transactions,
  notifications,
} from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  // Categories
  const [cat1] = await db.insert(categories).values([
    { name: 'الکترونیک', slug: 'electronics', icon: 'laptop' },
    { name: 'پوشاک', slug: 'clothing', icon: 'shirt' },
    { name: 'خانه و آشپزخانه', slug: 'home-kitchen', icon: 'home' },
    { name: 'ورزش و فیتنس', slug: 'sports', icon: 'dumbbell' },
    { name: 'زیبایی و بهداشت', slug: 'beauty', icon: 'sparkles' },
  ]).returning();

  // Seller
  const [seller] = await db.insert(sellers).values({
    name: 'احمد رضایی',
    email: 'seller@empireshop.com',
    phone: '09123456789',
    password: 'hashed_password_here',
    status: 'active',
  }).returning();

  // Store Profile
  await db.insert(storeProfiles).values({
    sellerId: seller.id,
    storeName: 'فروشگاه تکنو پلاس',
    slug: 'techno-plus',
    description: 'بهترین محصولات الکترونیکی با گارانتی اصل',
    phone: '02112345678',
    email: 'info@technoplus.ir',
    city: 'تهران',
    province: 'تهران',
    address: 'خیابان ولیعصر، پلاک ۱۲۳',
    instagram: 'technoplus_ir',
    telegram: 'technoplus',
    bankName: 'بانک ملت',
    bankAccount: '1234567890',
    bankIban: 'IR12 0120 0000 0000 1234 5678 90',
    bankOwner: 'احمد رضایی',
    rating: 4.7,
    totalSales: 342,
  });

  // Products
  const productData = [
    {
      sellerId: seller.id,
      categoryId: 1,
      name: 'گوشی سامسونگ Galaxy S24',
      slug: 'samsung-galaxy-s24',
      description: 'گوشی هوشمند پرچمدار سامسونگ با دوربین ۲۰۰ مگاپیکسل',
      price: 32000000,
      comparePrice: 35000000,
      discountPercent: 8,
      stock: 45,
      weight: 0.167,
      tags: JSON.stringify(['گوشی', 'سامسونگ', 'اندروید']),
      attributes: JSON.stringify({ رنگ: 'مشکی', حافظه: '256GB', RAM: '12GB' }),
      mainImage: '/uploads/products/samsung-s24.jpg',
      images: JSON.stringify(['/uploads/products/samsung-s24.jpg', '/uploads/products/samsung-s24-2.jpg']),
      status: 'active' as const,
      isFeatured: true,
      soldCount: 28,
      viewCount: 1240,
    },
    {
      sellerId: seller.id,
      categoryId: 1,
      name: 'لپ تاپ ایسوس VivoBook 15',
      slug: 'asus-vivobook-15',
      description: 'لپ تاپ قدرتمند با پردازنده Intel Core i7',
      price: 45000000,
      discountPercent: 5,
      stock: 12,
      weight: 1.8,
      tags: JSON.stringify(['لپ تاپ', 'ایسوس']),
      attributes: JSON.stringify({ CPU: 'i7', RAM: '16GB', SSD: '512GB' }),
      status: 'active' as const,
      soldCount: 15,
      viewCount: 890,
    },
    {
      sellerId: seller.id,
      categoryId: 1,
      name: 'هدفون بی‌سیم Sony WH-1000XM5',
      slug: 'sony-wh-1000xm5',
      description: 'هدفون حرفه‌ای با قابلیت حذف نویز فعال',
      price: 8500000,
      comparePrice: 10000000,
      discountPercent: 15,
      stock: 0,
      status: 'out_of_stock' as const,
      soldCount: 67,
      viewCount: 2100,
    },
  ];

  const insertedProducts = await db.insert(products).values(productData).returning();

  // Orders
  const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
  const paymentStatuses = ['unpaid', 'paid', 'refunded'] as const;

  const sampleOrders = Array.from({ length: 20 }, (_, i) => ({
    orderNumber: `ORD-${String(1000 + i).padStart(6, '0')}`,
    sellerId: seller.id,
    customerName: ['علی محمدی', 'سارا احمدی', 'حسن رضایی', 'مریم کریمی', 'رضا نجفی'][i % 5],
    customerEmail: `customer${i + 1}@email.com`,
    customerPhone: `0912${String(1000000 + i * 111).padStart(7, '0')}`,
    shippingAddress: 'خیابان آزادی، پلاک ' + (i + 10),
    shippingCity: ['تهران', 'اصفهان', 'شیراز', 'تبریز'][i % 4],
    shippingProvince: ['تهران', 'اصفهان', 'فارس', 'آذربایجان شرقی'][i % 4],
    subtotal: Math.floor(Math.random() * 20000000) + 5000000,
    shippingFee: 150000,
    discount: i % 3 === 0 ? 500000 : 0,
    total: Math.floor(Math.random() * 20000000) + 5000000,
    status: orderStatuses[i % orderStatuses.length],
    paymentStatus: paymentStatuses[i % paymentStatuses.length],
    paymentMethod: i % 2 === 0 ? 'online' : 'wallet',
    trackingCode: i % 3 === 0 ? `TRK${Date.now()}${i}` : null,
    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
  }));

  const insertedOrders = await db.insert(orders).values(sampleOrders).returning();

  // Order Items
  for (const order of insertedOrders.slice(0, 10)) {
    await db.insert(orderItems).values({
      orderId: order.id,
      productId: insertedProducts[0].id,
      productName: insertedProducts[0].name,
      price: insertedProducts[0].price,
      quantity: Math.floor(Math.random() * 3) + 1,
      total: insertedProducts[0].price * (Math.floor(Math.random() * 3) + 1),
    });
  }

  // Transactions
  const txTypes = ['income', 'withdrawal', 'refund', 'fee'] as const;
  await db.insert(transactions).values(
    Array.from({ length: 15 }, (_, i) => ({
      sellerId: seller.id,
      orderId: i < 10 ? insertedOrders[i].id : null,
      type: txTypes[i % txTypes.length],
      amount: Math.floor(Math.random() * 10000000) + 1000000,
      description: [
        'پرداخت سفارش',
        'برداشت از حساب',
        'بازگشت وجه',
        'کارمزد پلتفرم',
      ][i % 4],
      status: 'completed' as const,
      referenceId: `REF${Date.now()}${i}`,
      createdAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
    }))
  );

  // Notifications
  await db.insert(notifications).values([
    {
      sellerId: seller.id,
      title: 'سفارش جدید دریافت شد',
      message: 'سفارش ORD-001000 از مشتری علی محمدی ثبت شد',
      type: 'order' as const,
      isRead: false,
      link: '/seller/orders',
    },
    {
      sellerId: seller.id,
      title: 'پرداخت تایید شد',
      message: 'پرداخت ۳۲،۰۰۰،۰۰۰ تومان برای سفارش ORD-001001 تایید شد',
      type: 'payment' as const,
      isRead: false,
      link: '/seller/payments',
    },
    {
      sellerId: seller.id,
      title: 'موجودی کم است',
      message: 'موجودی محصول "لپ تاپ ایسوس VivoBook 15" به ۱۲ عدد رسید',
      type: 'product' as const,
      isRead: true,
      link: '/seller/products',
    },
    {
      sellerId: seller.id,
      title: 'نظر جدید',
      message: 'یک نظر جدید برای محصول شما ثبت شد',
      type: 'review' as const,
      isRead: true,
    },
    {
      sellerId: seller.id,
      title: 'به‌روزرسانی سیستم',
      message: 'سیستم فروشگاه با موفقیت به‌روزرسانی شد',
      type: 'system' as const,
      isRead: false,
    },
  ]);

  console.log('✅ Seeding completed!');
  process.exit(0);
}

seed().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
