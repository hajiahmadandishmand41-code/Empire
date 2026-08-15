'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Play, X, ExternalLink } from 'lucide-react';

interface ProductVideoPlayerProps {
  videoUrl: string;
  productName: string;
}

function getVideoType(url: string): 'youtube' | 'vimeo' | 'local' | 'unknown' {
  if (/youtube\.com\/watch|youtu\.be\//.test(url)) return 'youtube';
  if (/vimeo\.com\//.test(url)) return 'vimeo';
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return 'local';
  return 'unknown';
}

function getEmbedUrl(url: string, type: 'youtube' | 'vimeo' | 'local' | 'unknown'): string {
  if (type === 'youtube') {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
    if (match?.[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1`;
    }
  }
  if (type === 'vimeo') {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match?.[1]) {
      return `https://player.vimeo.com/video/${match[1]}?autoplay=1&title=0&byline=0`;
    }
  }
  return url;
}

export function ProductVideoPlayer({ videoUrl, productName }: ProductVideoPlayerProps) {
  const [open, setOpen] = React.useState(false);
  const type = getVideoType(videoUrl);
  const embedUrl = getEmbedUrl(videoUrl, type);

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-rose-300 bg-rose-50/50 px-5 py-3 font-bold text-rose-600 transition-all hover:border-rose-400 hover:bg-rose-50 hover:shadow-sm dark:border-rose-800 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:border-rose-600 dark:hover:bg-rose-950/30"
        aria-label={`مشاهده ویدیو ${productName}`}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 shadow-sm">
          <Play className="h-4 w-4 fill-white text-white" aria-hidden />
        </span>
        <span>مشاهده ویدیو محصول</span>
      </button>

      {/* Modal Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal
          aria-label={`ویدیو ${productName}`}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="relative w-full max-w-3xl">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="بستن ویدیو"
              className="absolute -top-10 end-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-all hover:bg-white/30"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>

            {/* Video Player */}
            <div className={cn('relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl', type === 'local' ? '' : 'aspect-video')}>
              {type === 'youtube' || type === 'vimeo' ? (
                <iframe
                  src={embedUrl}
                  title={`ویدیو ${productName}`}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : type === 'local' ? (
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  className="aspect-video w-full"
                  title={productName}
                >
                  مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                </video>
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center gap-3 text-white/70">
                  <ExternalLink className="h-12 w-12" aria-hidden />
                  <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline hover:text-white">
                    مشاهده ویدیو در مرورگر
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
