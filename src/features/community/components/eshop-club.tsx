'use client';

import * as React from 'react';
import { Heart, MessageCircle, Plus, Send, Sparkles, UsersRound, Reply, Loader2 } from 'lucide-react';

interface ReplyItem { id: string; content: string; author: string; createdAt: string; likes: number; liked: boolean }
interface Post { id: string; content: string; author: string; createdAt: string; likes: number; liked: boolean; replies: ReplyItem[] }

const copy = {
  fa: { eyebrow: 'جامعه ایشاپ', title: 'باشگاه ایشاپ', subtitle: 'تجربه خرید، پیشنهاد، سؤال و ایده‌تان را با دیگران شریک شوید.', placeholder: 'پیام خود را برای جامعه ایشاپ بنویسید…', send: 'انتشار پیام', reply: 'پاسخ', replyPlaceholder: 'پاسخ خود را بنویسید…', empty: 'هنوز پیامی ثبت نشده؛ اولین نفر شما باشید.', signIn: 'برای نوشتن پیام وارد حساب شوید.', loading: 'در حال بارگذاری…', like: 'پسندیدن', liked: 'پسندیده شد', community: 'گفت‌وگوی واقعی بین خریداران ایشاپ' },
  ps: { eyebrow: 'د ایشاپ ټولنه', title: 'د ایشاپ کلب', subtitle: 'خپله د پېرود تجربه، پوښتنه، وړاندیز او نظر له نورو سره شریک کړئ.', placeholder: 'د ایشاپ ټولنې لپاره خپل پیغام ولیکئ…', send: 'پیغام خپور کړئ', reply: 'ځواب', replyPlaceholder: 'خپل ځواب ولیکئ…', empty: 'تر اوسه کوم پیغام نشته؛ لومړی کس تاسو اوسئ.', signIn: 'د لیکلو لپاره خپل حساب ته ننوځئ.', loading: 'بار کېږي…', like: 'خوښول', liked: 'خوښ شوی', community: 'د ایشاپ د پیرودونکو ریښتینې خبرې' },
  en: { eyebrow: 'Eshop community', title: 'Eshop Club', subtitle: 'Share shopping experiences, questions and ideas with the Eshop community.', placeholder: 'Write a message for the Eshop community…', send: 'Post message', reply: 'Reply', replyPlaceholder: 'Write your reply…', empty: 'No messages yet. Start the conversation.', signIn: 'Sign in to write a message.', loading: 'Loading…', like: 'Like', liked: 'Liked', community: 'Real conversations between Eshop shoppers' },
} as const;

type Locale = keyof typeof copy;

export function EshopClub({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [message, setMessage] = React.useState('');
  const [replyText, setReplyText] = React.useState<Record<string, string>>({});
  const [replyOpen, setReplyOpen] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [posting, setPosting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [now, setNow] = React.useState(() => Date.now());

  const load = React.useCallback(async () => {
    try { const res = await fetch('/api/community/posts', { cache: 'no-store' }); const json = await res.json(); if (!res.ok || !json?.ok) throw new Error(json?.error?.message ?? t.loading); setPosts(json.data.posts ?? []); setError(null); }
    catch (err) { setError((err as Error).message); } finally { setLoading(false); }
  }, [t.loading]);

  React.useEffect(() => { void load(); }, [load]);
  React.useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30000); return () => window.clearInterval(timer); }, []);

  const submit = async (action: 'create' | 'reply', postId?: string) => {
    const content = action === 'create' ? message.trim() : (replyText[postId ?? ''] ?? '').trim();
    if (!content || posting) return;
    setPosting(true); setError(null);
    try {
      const res = await fetch('/api/community/posts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, content, postId }) });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error?.message ?? t.signIn);
      if (action === 'create') setMessage(''); else setReplyText((state) => ({ ...state, [postId ?? '']: '' }));
      setReplyOpen(null); await load();
    } catch (err) { setError((err as Error).message); } finally { setPosting(false); }
  };

  const like = async (postId: string) => {
    try {
      const res = await fetch('/api/community/posts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'like', postId }) });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error?.message ?? t.signIn);
      await load();
    } catch (err) { setError((err as Error).message); }
  };

  const relativeTime = (value: string) => {
    const seconds = Math.max(1, Math.floor((now - new Date(value).getTime()) / 1000));
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <div className="min-h-dvh bg-background">
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-rose-950 via-indigo-950 to-slate-950 text-white">
        <div className="absolute -left-16 top-8 h-40 w-40 rounded-full bg-rose-400/12 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-44 w-44 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-screen-xl px-3 py-7 sm:px-6 sm:py-9">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-extrabold text-rose-100"><Sparkles className="h-3 w-3" />{t.eyebrow}</span>
            <h1 className="mt-2.5 text-2xl font-black tracking-tight sm:text-4xl">{t.title}</h1>
            <p className="mt-2 max-w-xl text-[11px] leading-5 text-white/72 sm:text-sm sm:leading-6">{t.subtitle}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/10 px-2.5 py-1.5 text-[9px] font-bold text-white/80"><UsersRound className="h-3.5 w-3.5" />{t.community}</div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-screen-xl gap-4 px-3 py-4 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section className="min-w-0">
          <div className="rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><MessageCircle className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 1200))} rows={3} placeholder={t.placeholder} className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-xs leading-5 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10" />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[9px] text-muted-foreground">{message.length}/1200</span>
                  <button type="button" aria-label={t.send} title={t.send} onClick={() => void submit('create')} disabled={!message.trim() || posting} className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50">{posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}</button>
                </div>
              </div>
            </div>
          </div>

          {error ? <div role="alert" className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-[11px] font-semibold text-destructive">{error}</div> : null}
          <div className="mt-4 space-y-3">
            {loading ? <div className="rounded-2xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">{t.loading}</div> : null}
            {!loading && !posts.length ? <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">{t.empty}</div> : null}
            {posts.map((post) => (
              <article key={post.id} className="rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
                <div className="flex gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-rose-500/20 text-[11px] font-black text-primary">{post.author.slice(0, 1)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="text-xs font-black">{post.author}</span><span className="text-[9px] text-muted-foreground">{relativeTime(post.createdAt)}</span></div>
                    <p className="mt-1.5 whitespace-pre-wrap text-xs leading-6 text-foreground/90">{post.content}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <button type="button" onClick={() => void like(post.id)} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition ${post.liked ? 'border-rose-300/40 bg-rose-500/10 text-rose-600' : 'border-border bg-background text-muted-foreground hover:border-rose-300/40 hover:text-rose-600'}`}><Heart className={`h-3 w-3 ${post.liked ? 'fill-current' : ''}`} />{post.likes} {post.liked ? t.liked : t.like}</button>
                      <button type="button" onClick={() => setReplyOpen((value) => value === post.id ? null : post.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground transition hover:border-primary/30 hover:text-primary"><Reply className="h-3 w-3" />{t.reply} {post.replies.length ? `(${post.replies.length})` : ''}</button>
                    </div>
                  </div>
                </div>
                {post.replies.length ? <div className="mt-3 space-y-2 border-s-2 border-primary/10 ps-3">{post.replies.map((reply) => <div key={reply.id} className="rounded-xl bg-muted/40 p-2.5"><div className="flex items-center gap-2"><span className="text-[10px] font-black">{reply.author}</span><span className="text-[8px] text-muted-foreground">{relativeTime(reply.createdAt)}</span></div><p className="mt-1 text-[10px] leading-5 text-foreground/85">{reply.content}</p><button type="button" onClick={() => void like(reply.id)} className={`mt-1.5 inline-flex items-center gap-1 text-[9px] font-bold ${reply.liked ? 'text-rose-600' : 'text-muted-foreground hover:text-rose-600'}`}><Heart className={`h-2.5 w-2.5 ${reply.liked ? 'fill-current' : ''}`} />{reply.likes}</button></div>)}</div> : null}
                {replyOpen === post.id ? <div className="mt-3 flex gap-1.5 rounded-xl bg-muted/30 p-1.5"><input value={replyText[post.id] ?? ''} onChange={(e) => setReplyText((state) => ({ ...state, [post.id]: e.target.value.slice(0, 1200) }))} placeholder={t.replyPlaceholder} className="min-w-0 flex-1 bg-transparent px-2 text-[10px] outline-none" /><button type="button" onClick={() => void submit('reply', post.id)} disabled={!(replyText[post.id] ?? '').trim() || posting} className="flex h-7 items-center justify-center gap-1 rounded-lg bg-primary px-2 text-[10px] font-bold text-primary-foreground disabled:opacity-50">{posting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}{t.reply}</button></div> : null}
              </article>
            ))}
          </div>
        </section>

        <aside className="hidden lg:block"><div className="sticky top-24 rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><UsersRound className="h-5 w-5" /></div><h2 className="mt-3 text-sm font-black">{t.title}</h2><p className="mt-1.5 text-[10px] leading-5 text-muted-foreground">{t.subtitle}</p><div className="mt-3 h-px bg-border" /><p className="mt-3 text-[10px] font-bold text-muted-foreground">{t.community}</p></div></aside>
      </main>
    </div>
  );
}
