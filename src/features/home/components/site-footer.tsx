/**
 * SiteFooter — Stage 5
 * - Replaced all hardcoded gray colors with semantic design tokens
 * - Fixed broken /guide link → /faq
 * - Fixed broken /privacy link → /terms
 * - Added aria-label to footer nav sections
 * - Newsletter input uses semantic tokens
 */

import {
  Phone, Mail, MapPin, Instagram, Twitter, Send, Youtube, Headphones,
  ShieldCheck, Truck, RotateCcw, CreditCard, ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { EmpireLogo } from '@/components/empire-logo';
import { NewsletterForm } from './newsletter-form';

const navLinks = [
  { label: 'صفحه اصلی',              href: '/' },
  { label: 'فروشگاه',                 href: '/shop' },
  { label: 'محصولات جدید',            href: '/shop?sort=newest' },
  { label: 'پیشنهادات ویژه',          href: '/shop?badge=sale' },
  { label: 'پرفروش‌ترین‌ها',          href: '/shop?sort=bestSelling' },
  { label: 'محصولات سنتی',            href: '/traditional' },
  { label: 'همه دسته‌بندی‌ها',        href: '/shop?view=categories' },
];

const supportLinks = [
  { label: 'راهنمای خرید',            href: '/faq' },
  { label: 'پیگیری سفارش',            href: '/orders' },
  { label: 'مرجوعی و بازگشت',         href: '/returns' },
  { label: 'ضمانت محصولات',           href: '/warranty' },
  { label: 'سوالات متداول',           href: '/faq' },
  { label: 'تماس با پشتیبانی',        href: '/contact' },
];

const accountLinks = [
  { label: 'ورود',                    href: '/auth/login' },
  { label: 'ثبت‌نام',                 href: '/auth/register' },
  { label: 'حساب کاربری',             href: '/profile' },
  { label: 'سفارش‌های من',            href: '/orders' },
  { label: 'علاقه‌مندی‌ها',           href: '/wishlist' },
];

const sellerLinks = [
  { label: 'پنل فروشنده',             href: '/seller' },
  { label: 'ثبت محصول جدید',          href: '/seller/products/new' },
  { label: 'مدیریت سفارش‌ها',         href: '/seller/orders' },
  { label: 'گزارش درآمد',             href: '/seller/reports' },
  { label: 'کیف پول',                 href: '/seller/wallet' },
];

const trustItems = [
  {
    icon: ShieldCheck,
    label: 'خرید ۱۰۰٪ امن',
    sub: 'ضمانت اصالت محصولات',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
  },
  {
    icon: Truck,
    label: 'ارسال سریع',
    sub: 'به سراسر افغانستان',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
  },
  {
    icon: RotateCcw,
    label: 'مرجوعی ۷ روزه',
    sub: 'بدون سوال، بدون دردسر',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
  },
  {
    icon: CreditCard,
    label: 'پرداخت مطمئن',
    sub: 'رمزنگاری ۲۵۶ بیتی',
    iconBg: 'bg-rose-500/15',
    iconColor: 'text-rose-400',
  },
];

const socials = [
  { icon: Instagram, href: '#', label: 'اینستاگرام', color: 'hover:border-pink-500 hover:bg-pink-500/10 hover:text-pink-400' },
  { icon: Twitter,   href: '#', label: 'توییتر',     color: 'hover:border-sky-500 hover:bg-sky-500/10 hover:text-sky-400' },
  { icon: Send,      href: '#', label: 'تلگرام',     color: 'hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-400' },
  { icon: Youtube,   href: '#', label: 'یوتیوب',     color: 'hover:border-red-500 hover:bg-red-500/10 hover:text-red-400' },
];

const legalLinks = [
  { label: 'شرایط استفاده',  href: '/terms' },
  { label: 'حریم خصوصی',    href: '/terms' },
  { label: 'تماس با ما',     href: '/contact' },
  { label: 'قوانین مرجوعی', href: '/returns' },
];

/** Single footer link item */
function FooterLink({ label, href }: { label: string; href: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        <ChevronLeft
          className="h-3 w-3 opacity-0 shrink-0 text-primary transition-all -ms-4 group-hover:opacity-100 group-hover:ms-0"
          aria-hidden="true"
        />
        {label}
      </Link>
    </li>
  );
}

function FooterNav({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <nav aria-label={title} className="space-y-4">
      <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-foreground">
        <span className="inline-block h-3 w-0.5 rounded-full bg-primary" aria-hidden="true" />
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((l) => <FooterLink key={`${l.href}-${l.label}`} {...l} />)}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-card border-t border-border" role="contentinfo">

      {/* ── Trust bar ── */}
      <div className="border-b border-border/60 py-4">
        <Container size="xl">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {trustItems.map(({ icon: Icon, label, sub, iconBg, iconColor }) => (
              <div
                key={label}
                className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/50"
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} ring-1 ring-border transition-transform group-hover:scale-105`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* ── Main content ── */}
      <Container size="xl" className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">

          {/* Brand column */}
          <div className="space-y-5 lg:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-3 group w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
              aria-label="Empire Shop — صفحه اصلی"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 ring-1 ring-primary/20 shadow-lg shadow-primary/20 transition-transform group-hover:scale-105" aria-hidden="true">
                <EmpireLogo size={30} variant="color" />
              </div>
              <div>
                <span className="font-display block text-base font-extrabold text-foreground tracking-tight">EmpireShop</span>
                <span className="text-[10px] text-muted-foreground block -mt-0.5 tracking-wide">فروشگاه اینترنتی افغانستان</span>
              </div>
            </Link>

            <p className="text-sm leading-relaxed text-muted-foreground max-w-xs">
              بزرگ‌ترین فروشگاه اینترنتی افغانستان با هزاران محصول اصل از فروشندگان تأییدشده. ارسال سریع، پرداخت مطمئن و پشتیبانی ۲۴ ساعته.
            </p>

            {/* Contact */}
            <address className="not-italic space-y-2.5">
              <a
                href="tel:+93798228441"
                dir="ltr"
                className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                aria-label="شماره تلفن: +93 798 228 441"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Phone className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                </div>
                <span className="text-xs">+93 798 228 441</span>
              </a>
              <a
                href="mailto:support@empireshop.af"
                className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Mail className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                </div>
                <span className="text-xs">support@empireshop.af</span>
              </a>
              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                </div>
                <span className="text-xs text-muted-foreground mt-0.5">کابل، افغانستان</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Headphones className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                </div>
                <span className="text-xs text-muted-foreground">پشتیبانی ۲۴/۷</span>
              </div>
            </address>

            {/* Social icons */}
            <div className="flex items-center gap-2" role="list" aria-label="شبکه‌های اجتماعی">
              {socials.map(({ icon: Icon, href, label, color }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  role="listitem"
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${color}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          <FooterNav title="صفحات اصلی"    links={navLinks} />
          <FooterNav title="پشتیبانی"       links={supportLinks} />
          <FooterNav title="حساب کاربری"   links={accountLinks} />

          {/* Seller + Newsletter */}
          <div className="space-y-6">
            <FooterNav title="پنل فروشندگان" links={sellerLinks} />

            {/* Newsletter */}
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
              <div>
                <p className="text-xs font-bold text-foreground mb-0.5">دریافت تخفیف‌های ویژه</p>
                <p className="text-[11px] text-muted-foreground">ایمیل خود را وارد کنید</p>
              </div>
              <NewsletterForm />
            </div>
          </div>
        </div>
      </Container>

      {/* ── Bottom bar ── */}
      <div className="border-t border-border/60">
        <Container size="xl" className="py-4">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-[11px] text-muted-foreground">
              &copy; {year} EmpireShop. تمامی حقوق محفوظ است.
            </p>
            <nav aria-label="لینک‌های قانونی">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                {legalLinks.map(({ label, href }, i) => (
                  <span key={`${href}-${label}`} className="flex items-center gap-4">
                    <Link
                      href={href}
                      className="text-[11px] text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      {label}
                    </Link>
                    {i < legalLinks.length - 1 && (
                      <span aria-hidden="true" className="text-border text-xs">·</span>
                    )}
                  </span>
                ))}
              </div>
            </nav>
          </div>
        </Container>
      </div>
    </footer>
  );
}
