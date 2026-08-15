# Empire Shop 🛒

فروشگاه جامع افغانستان — Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui + Prisma + next-intl

---

## ویژگی‌ها

- **چند زبانه:** فارسی (پیش‌فرض)، پشتو، انگلیسی — RTL/LTR خودکار
- **پنل ادمین:** مدیریت کاربران، فروشندگان، محصولات، سفارشات، پرداخت‌ها، گزارش‌ها
- **پنل فروشنده:** مدیریت محصولات، سفارشات، کیف پول، درخواست برداشت
- **پنل خریدار:** سبد خرید، تکمیل سفارش، پیگیری سفارش، پروفایل
- **احراز هویت:** کوکی session امضا شده با HMAC-SHA256
- **پایگاه داده:** PostgreSQL + Prisma ORM

---

## پیش‌نیازها

- Node.js 24 LTS (see `.nvmrc`)
- pnpm (یا npm / yarn)
- PostgreSQL 14+

---

## راه‌اندازی محلی

### ۱. کپی متغیرهای محیطی

```bash
cp .env.example .env.local
```

`.env.local` را ویرایش کنید و حداقل `DATABASE_URL` و `AUTH_SECRET` را تنظیم کنید:

```env
DATABASE_URL="postgresql://empire_user:empire_pass@localhost:5432/empire_shop"
AUTH_SECRET="حداقل-۳۲-کاراکتر-تصادفی"
```

### ۲. نصب وابستگی‌ها

```bash
npm install
```

### ۳. ساخت پایگاه داده

```bash
# اجرای migration ها
npm run db:deploy

# دریافت Prisma client
npm run db:generate

# دیتای اولیه (دسته‌بندی‌ها + نمونه محصولات)
npm run db:seed
```

### ۴. اجرای سرور توسعه

```bash
npm run dev
```

برنامه روی `http://localhost:3000` در دسترس خواهد بود.

---

## دستورات مهم

| دستور | توضیح |
|---|---|
| `npm run dev` | سرور توسعه |
| `npm run build` | build تولید |
| `npm run start` | سرور تولید |
| `npm run lint` | بررسی ESLint |
| `npm run typecheck` | بررسی TypeScript |
| `npm run db:migrate` | ایجاد migration جدید |
| `npm run db:deploy` | اجرای migration ها در تولید |
| `npm run db:seed` | دیتای اولیه |
| `npm run db:studio` | رابط بصری Prisma |

---

## ساختار پروژه

```
src/
├── app/
│   ├── [locale]/          # مسیرهای محلی‌سازی‌شده
│   │   ├── admin/         # پنل ادمین
│   │   ├── seller/        # پنل فروشنده
│   │   ├── profile/       # پروفایل کاربر
│   │   └── page.tsx       # صفحه اصلی
│   └── api/               # API Routes
├── features/
│   ├── admin/             # منطق پنل ادمین
│   ├── seller/            # منطق پنل فروشنده
│   └── home/              # صفحه اصلی
├── lib/
│   ├── auth/              # احراز هویت و session
│   ├── api/               # ابزارهای API
│   └── finance/           # منطق مالی (کیف پول)
├── server/
│   ├── services/          # سرویس‌های دامنه
│   ├── repositories/      # لایه دسترسی به داده
│   └── algorithms/        # رتبه‌بندی و جستجو
├── components/            # کامپوننت‌های مشترک UI
├── styles/                # فایل‌های CSS
└── i18n/                  # تنظیمات next-intl
messages/
├── fa.json                # فارسی
├── ps.json                # پشتو
└── en.json                # انگلیسی
prisma/
├── schema.prisma          # طرح پایگاه داده
└── seed.ts                # دیتای اولیه
```

---

## محیط تولید

```bash
# متغیرهای محیطی تولید
AUTH_SECRET="..."          # حداقل ۳۲ کاراکتر تصادفی
DATABASE_URL="..."         # PostgreSQL
NEXT_PUBLIC_APP_URL="..."  # URL عمومی

# build
npm run build
npm run start
```

---

## فناوری‌ها

- **Next.js 16** (App Router)
- **TypeScript 5.6**
- **Tailwind CSS 3** + shadcn/ui
- **Prisma 5** + PostgreSQL
- **next-intl 4** (fa / ps / en)
- **Zustand** — مدیریت state کلاینت
- **Zod** — اعتبارسنجی
- **Sonner** — اعلان‌های toast
- **Recharts** — نمودارها

## Production hardening — v0.14.0

- Google OAuth login button now uses a real browser navigation to the OAuth start route, preserving a safe post-login redirect and fixing the callback runtime crypto dependency.
- Product catalog now supports a `recommended` feed with bounded candidate re-ranking using stock, sales, views, ratings, review volume, recency, and promotion signals.
- Checkout keeps the local cart until an online ATOMA Pay session is successfully created, preventing cart loss on temporary gateway failures.
- ATOMA Pay integration is production-configurable. The Afghan ATOMA public site documents merchant registration and wallet/merchant payments, but does not publish a public web API contract; therefore production API base URL/path values must come from ATOMA merchant onboarding rather than being guessed.
- Production startup validation now requires the ATOMA API base URL and configured create/status paths.
