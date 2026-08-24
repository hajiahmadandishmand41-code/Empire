'use client';

import * as React from 'react';
import { Heart, MessageCircle, Send, Sparkles, UsersRound, Reply, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReplyItem { id: string; content: string; author: string; createdAt: string; likes: number; liked: boolean }
interface Post { id: string; content: string; author: string; createdAt: string; likes: number; liked: boolean; replies: ReplyItem[] }

const copy = {
  fa: { eyebrow: 'جامعه ایشاپ', title: 'باشگاه ایشاپ', subtitle: 'اینجا جای حرف‌های شماست؛ تجربه خرید، پیشنهاد، سؤال و ایده‌تان را با دیگران شریک شوید.', placeholder: 'پیام خود را برای جامعه ایشاپ بنویسید…', send: 'انتشار پیام', reply: 'پاسخ', replyPlaceholder: 'پاسخ خود را بنویسید…', empty: 'هنوز پیامی ثبت نشده؛ اولین نفر شما باشید.', signIn: 'برای نوشتن پیام وارد حساب شوید.', loading: 'در حال بارگذاری…', like: 'پسندیدن', liked: 'پسندیده شد', community: 'گفت‌وگوی واقعی بین خریداران و دوستداران ایشاپ' },
  ps: { eyebrow: 'د ایشاپ ټولنه', title: 'د ایشاپ کلب', subtitle: 'خپله د پېرود تجربه، پوښتنه، وړاندیز او نظر له نورو سره شریک کړئ.', placeholder: 'د ایشاپ ټولنې لپاره خپل پیغام ولیکئ…', send: 'پیغام خپور کړئ', reply: 'ځواب', replyPlaceholder: 'خپل ځواب ولیکئ…', empty: 'تر اوسه کوم پیغام نشته؛ لومړی کس تاسو اوسئ.', signIn: 'د لیکلو لپاره خپل حساب ته ننوځئ.', loading: 'بار کېږي…', like: 'خوښول', liked: 'خوښ شوی', community: 'د ایشاپ د پیرودونکو او مینه‌والو ریښتینې خبرې' },
  en: { eyebrow: 'Eshop community', title: 'Eshop Club', subtitle: 'Share your shopping experience, questions, ideas and recommendations with the Eshop community.', placeholder: 'Write a message for the Eshop community…', send: 'Post message', reply: 'Reply', replyPlaceholder: 'Write your reply…', empty: 'No messages yet. Start the conversation.', signIn: 'Sign in to write a message.', loading: 'Loading…', like: 'Like', liked: 'Liked', community: 'Real conversations between Eshop shoppers and fans' },
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

  const load = React.useCallback(async () => {
    try {
      const res = await fetch('/api/community/posts', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error?.message ?? t.loading);
      setPosts(json.data.posts ?? []);
      setError(null);
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }, [t.loading]);

  React.useEffect(() => { void load(); }, [load]);

  const submit = async (action: 'create' | 'reply', postId?: string) => {
    const content = action === 'create' ? message.trim() : (replyText[postId ?? ''] ?? '').trim();
    if (!content || posting) return;
    setPosting(true); setError(null);
    try {
      const res = await fetch('/api/community/posts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, content, postId }) });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error?.message ?? t.signIn);
      if (action === 'create') setMessage(''); else setReplyText((state) => ({ ...state, [postId ?? '']: '' }));
      setReplyOpen(null);
      await load();
    } catch (err) { setError((err as Error).message); }
    finally { setPosting(false); }
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
    const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <div className="min-h-dvh bg-background">
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-rose-950 via-indigo-950 to-slate-950 text-white">
        <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-rose-400/15 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-violet-400/15 blur-3xl" />
        <div className="relative mx-auto max-w-screen-xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold tracking-wide text-rose-100"><Sparkles className="h-3.5 w-3.5" />{t.eyebrow}</span>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">{t.title}</h1>
            <p className="mt-4 text-sm leading-7 text-white/70 sm:text-base">{t.subtitle}</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3.5 py-2 text-[11px] font-bold text-white/80"><UsersRound className="h-4 w-4" />{t.community}</div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-screen-xl gap-6 px-3 py-6 sm:px-6 sm:py-9 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          <div className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><MessageCircle className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 1200))} rows={4} placeholder={t.placeholder} className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10" />
                <div className="mt-3 flex items-center justify-between gap-3"><span className="text-[10px] text-muted-foreground">{message.length}/1200</span><Button onClick={() => void submit('create')} disabled={!message.trim() || posting} className="rounded-xl">{posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 rtl:rotate-180" />}{t.send}</Button></div>
              </div>
            </div>
          </div>

          {error ? <div role="alert" className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs font-semibold text-destructive">{error}</div> : null}
          <div className="mt-5 space-y-4">
            {loading ? <div className="rounded-3xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">{t.loading}</div> : null}
            {!loading && !posts.length ? <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">{t.empty}</div> : null}
            {posts.map((post) => <article key={post.id} className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-rose-500/20 text-xs font-black text-primary">{post.author.slice(0, 1)}</div>
                <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-sm font-black">{post.author}</span><span className="text-[10px] text-muted-foreground">{relativeTime(post.createdAt)}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground/90">{post.content}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => void like(post.id)} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition ${post.liked ? 'border-rose-300/40 bg-rose-500/10 text-rose-600' : 'border-border bg-background text-muted-foreground hover:border-rose-300/40 hover:text-rose-600'}`}><Heart className={`h-3.5 w-3.5 ${post.liked ? 'fill-current' : ''}`} />{post.likes} {post.liked ? t.liked : t.like}</button>
                    <button type="button" onClick={() => setReplyOpen((value) => value === post.id ? null : post.id)} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-[11px] font-bold text-muted-foreground transition hover:border-primary/30 hover:text-primary"><Reply className="h-3.5 w-3.5" />{t.reply} {post.replies.length ? `(${post.replies.length})` : ''}</button>
                  </div>
                </div>
              </div>
              {post.replies.length ? <div className="mt-4 space-y-2 border-s-2 border-primary/10 ps-4">{post.replies.map((reply) => <div key={reply.id} className="rounded-2xl bg-muted/40 p-3"><div className="flex items-center gap-2"><span className="text-xs font-black">{reply.author}</span><span className="text-[9px] text-muted-foreground">{relativeTime(reply.createdAt)}</span></div><p className="mt-1.5 text-xs leading-6 text-foreground/85">{reply.content}</p><button type="button" onClick={() => void like(reply.id)} className={`mt-2 inline-flex items-center gap-1 text-[10px] font-bold ${reply.liked ? 'text-rose-600' : 'text-muted-foreground hover:text-rose-600'}`}><Heart className={`h-3 w-3 ${reply.liked ? 'fill-current' : ''}`} />{reply.likes}</button></div>)}</div> : null}
              {replyOpen === post.id ? <div className="mt-4 flex gap-2 rounded-2xl bg-muted/30 p-2"><input value={replyText[post.id] ?? ''} onChange={(e) => setReplyText((state) => ({ ...state, [post.id]: e.target.value.slice(0, 1200) }))} placeholder={t.replyPlaceholder} className="min-w-0 flex-1 bg-transparent px-2 text-xs outline-none" /><Button size="sm" onClick={() => void submit('reply', post.id)} disabled={!(replyText[post.id] ?? '').trim() || posting} className="rounded-xl">{posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}{t.reply}</Button></div> : null}
            </article>)}
          </div>
        </section>

        <aside className="hidden lg:block"><div className="sticky top-28 rounded-3xl border border-border bg-card p-5 shadow-sm"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UsersRound className="h-6 w-6" /></div><h2 className="mt-4 text-base font-black">{t.title}</h2><p className="mt-2 text-xs leading-6 text-muted-foreground">{t.subtitle}</p><div className="mt-5 h-px bg-border" /><p className="mt-4 text-[11px] font-bold text-muted-foreground">{t.community}</p></div></aside>
      </main>
    </div>
  );
}
