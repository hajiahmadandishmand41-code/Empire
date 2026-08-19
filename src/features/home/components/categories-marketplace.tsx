'use client';

import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from '@/i18n/routing';

export type MarketplaceCategory = { key:string; slug:string; name:string; productCount?:number; title:string; image:string };
type Props={categories:MarketplaceCategory[];locale:string;placeholder:string;allLabel:string};

export function CategoriesMarketplace({categories,locale,placeholder,allLabel}:Props){
  const [query,setQuery]=useState('');
  const [active,setActive]=useState('all');
  const visible=useMemo(()=>categories.filter(c=>{const q=query.trim().toLocaleLowerCase(locale);const hay=`${c.name} ${c.title}`.toLocaleLowerCase(locale);return (!q||hay.includes(q))&&(active==='all'||c.key===active);}),[active,categories,locale,query]);
  const selected=categories.find(c=>c.key===active);
  return <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-3 flex items-center gap-2 px-2 text-sm font-black"><SlidersHorizontal className="h-4 w-4 text-primary"/>{locale==='en'?'Main categories':locale==='ps'?'اصلي وېشنيزې':'دسته‌های اصلی'}</div>
        <button type="button" onClick={()=>setActive('all')} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start text-xs font-bold transition ${active==='all'?'bg-primary text-primary-foreground':'hover:bg-muted'}`}><span>{allLabel}</span><ChevronDown className="h-3.5 w-3.5"/></button>
        <div className="max-h-[52vh] space-y-1 overflow-y-auto pe-1">{categories.map(c=><button key={c.key} type="button" onClick={()=>setActive(c.key)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start text-xs font-bold transition ${active===c.key?'bg-primary/10 text-primary':'hover:bg-muted'}`}><span className="truncate">{c.title}</span><span className="ms-2 shrink-0 text-[10px] text-muted-foreground">{c.productCount??0}</span></button>)}</div>
      </div>
    </aside>
    <div className="min-w-0 space-y-5">
      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm"><div className="relative"><Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="h-11 w-full rounded-xl border border-border bg-muted/40 ps-10 pe-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"/></div></div>
      <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold text-primary">{locale==='en'?'Explore by shelf':locale==='ps'?'د بازار د برخې له مخې':'کشف بر اساس قفسه'}</p><h2 className="mt-1 text-xl font-black">{selected?.title ?? (locale==='en'?'All categories':locale==='ps'?'ټولې وېشنيزې':'همه دسته‌ها')}</h2></div><span className="text-xs text-muted-foreground">{visible.length} {locale==='en'?'items':locale==='ps'?'برخې':'بخش'}</span></div>
      {visible.length===0?<div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center"><p className="text-lg font-black">{locale==='en'?'No categories found':locale==='ps'?'هېڅ وېشنيزه ونه موندل شوه':'دسته‌ای پیدا نشد'}</p></div>:<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{visible.map(c=><Link key={c.key} href={`/category/${c.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"><div className="relative aspect-[1.12] overflow-hidden bg-muted"><img src={c.image} alt={c.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent"/><div className="absolute inset-x-3 bottom-3 text-white"><h3 className="line-clamp-2 text-sm font-black sm:text-base">{c.title}</h3><p className="mt-1 text-[11px] font-semibold text-white/80">{c.productCount??0} {locale==='en'?'products':locale==='ps'?'محصولات':'محصول'}</p></div></div></Link>)}</div>}
    </div>
  </div>;
}
