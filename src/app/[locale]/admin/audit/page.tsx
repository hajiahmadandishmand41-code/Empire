'use client';
import { useEffect, useMemo, useState } from 'react';

type AuditRow={id:string;createdAt:string;actorId:string;action:string;entityType:string;entityId:string;beforeJson:unknown;afterJson:unknown};
type Meta={total:number;page:number;pageSize:number};

const PAGE_SIZE=25;
const ACTION_LABEL:Record<string,string>={create:'ایجاد',update:'به‌روزرسانی',delete:'حذف',approve:'تأیید',reject:'رد',login:'ورود',logout:'خروج'};

export default function AuditPage(){
  const [rows,setRows]=useState<AuditRow[]>([]);
  const [meta,setMeta]=useState<Meta>({total:0,page:1,pageSize:PAGE_SIZE});
  const [page,setPage]=useState(1);
  const [q,setQ]=useState('');
  const [loading,setLoading]=useState(true);
  const [selected,setSelected]=useState<AuditRow|null>(null);

  async function load(nextPage=page){
    setLoading(true);
    try{
      const r=await fetch(`/api/admin/audit?page=${nextPage}&pageSize=${PAGE_SIZE}`);
      const j=await r.json();
      setRows((j.data??[]) as AuditRow[]);
      setMeta((j.meta??{total:0,page:nextPage,pageSize:PAGE_SIZE}) as Meta);
      setPage(nextPage);
    }catch{setRows([]);setMeta((m)=>({...m,total:0,page:nextPage}));}
    finally{setLoading(false);}
  }
  useEffect(()=>{void load(1)},[]);

  const filtered=useMemo(()=>{
    const needle=q.trim().toLowerCase();
    if(!needle)return rows;
    return rows.filter(r=>`${r.actorId} ${r.action} ${r.entityType} ${r.entityId}`.toLowerCase().includes(needle));
  },[rows,q]);
  const totalPages=Math.max(1,Math.ceil(meta.total/PAGE_SIZE));

  return <div className="space-y-6">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-2xl font-black text-foreground">گزارش حسابرسی</h1><p className="mt-1 text-sm text-muted-foreground">ثبت تغییرات حساس مدیران به‌صورت فقط‌افزودنی، با امکان بررسی جزئیات قبل و بعد.</p></div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><span>مجموع {meta.total.toLocaleString('fa-IR')} رویداد</span><span className="rounded-full bg-muted px-2 py-1">صفحه {meta.page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}</span></div>
    </header>

    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="جستجو در مدیر، عملیات یا موجودیت…" className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm sm:max-w-md"/><button type="button" onClick={()=>void load(1)} className="h-10 rounded-xl border border-border bg-background px-4 text-sm font-bold hover:bg-muted">به‌روزرسانی</button></div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[940px] text-sm"><thead className="bg-muted/40"><tr><th className="px-3 py-3 text-start">زمان</th><th className="px-3 py-3 text-start">مدیر</th><th className="px-3 py-3 text-start">عملیات</th><th className="px-3 py-3 text-start">موجودیت</th><th className="px-3 py-3 text-start">جزئیات</th></tr></thead>
          <tbody className="divide-y divide-border">{loading?<tr><td colSpan={5} className="px-3 py-12 text-center text-sm text-muted-foreground">در حال بارگذاری…</td></tr>:filtered.map(r=><tr key={r.id} className="hover:bg-muted/20"><td className="px-3 py-3 text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString('fa-IR')}</td><td className="px-3 py-3 font-mono text-xs">{r.actorId}</td><td className="px-3 py-3 font-semibold">{ACTION_LABEL[r.action]??r.action}</td><td className="px-3 py-3"><span className="font-medium">{r.entityType}</span><span className="ms-1 font-mono text-xs text-muted-foreground">/{r.entityId}</span></td><td className="px-3 py-3"><button type="button" onClick={()=>setSelected(r)} className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted">مشاهده تغییرات</button></td></tr>)}</tbody>
        </table>{!loading&&filtered.length===0&&<div className="p-10 text-center text-sm text-muted-foreground">رویدادی با این جستجو پیدا نشد.</div>}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3"><button type="button" disabled={page<=1||loading} onClick={()=>void load(page-1)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40">قبلی</button><span className="text-xs text-muted-foreground">{meta.total.toLocaleString('fa-IR')} رویداد</span><button type="button" disabled={page>=totalPages||loading} onClick={()=>void load(page+1)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40">بعدی</button></div>
    </section>

    {selected&&<div className="fixed inset-0 z-50 bg-slate-950/45 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="جزئیات گزارش حسابرسی" onClick={()=>setSelected(null)}><div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-border bg-background p-5 shadow-2xl" onClick={(e)=>e.stopPropagation()}><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-black">جزئیات تغییر</h2><p className="mt-1 text-xs text-muted-foreground">{new Date(selected.createdAt).toLocaleString('fa-IR')} · {selected.entityType}/{selected.entityId}</p></div><button type="button" onClick={()=>setSelected(null)} className="rounded-lg border border-border px-3 py-1.5 text-xs">بستن</button></div><div className="mt-5 grid gap-4 lg:grid-cols-2"><div><h3 className="mb-2 text-sm font-bold">قبل از تغییر</h3><pre className="max-h-[55vh] overflow-auto rounded-xl bg-muted/50 p-3 text-xs leading-6" dir="ltr">{selected.beforeJson?JSON.stringify(selected.beforeJson,null,2):'—'}</pre></div><div><h3 className="mb-2 text-sm font-bold">بعد از تغییر</h3><pre className="max-h-[55vh] overflow-auto rounded-xl bg-muted/50 p-3 text-xs leading-6" dir="ltr">{selected.afterJson?JSON.stringify(selected.afterJson,null,2):'—'}</pre></div></div></div></div>}
  </div>
}
