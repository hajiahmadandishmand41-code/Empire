import type { LucideIcon } from 'lucide-react';
import {
  Shirt, Smartphone, Home, Sparkles, Dumbbell, ShoppingBag,
  Baby, BookOpen, Zap, Watch,
} from 'lucide-react';

/**
 * General-store categories — covers clothing, digital, home appliances,
 * beauty, sports, footwear, baby, books, electronics, watches.
 */
export interface CategoryItem {
  key:
    | 'clothing'
    | 'digital'
    | 'homeAppliances'
    | 'beauty'
    | 'sports'
    | 'footwear'
    | 'baby'
    | 'books'
    | 'electronics'
    | 'watches';
  Icon: LucideIcon;
  accent: {
    from: string;
    to: string;
  };
}

export const categories: CategoryItem[] = [
  {
    key: 'clothing',
    Icon: Shirt,
    accent: { from: 'from-rose-500/20', to: 'to-pink-500/10' },
  },
  {
    key: 'digital',
    Icon: Smartphone,
    accent: { from: 'from-blue-500/20', to: 'to-indigo-500/10' },
  },
  {
    key: 'homeAppliances',
    Icon: Home,
    accent: { from: 'from-amber-500/20', to: 'to-orange-500/10' },
  },
  {
    key: 'beauty',
    Icon: Sparkles,
    accent: { from: 'from-purple-500/20', to: 'to-pink-400/10' },
  },
  {
    key: 'sports',
    Icon: Dumbbell,
    accent: { from: 'from-green-500/20', to: 'to-emerald-500/10' },
  },
  {
    key: 'footwear',
    Icon: ShoppingBag,
    accent: { from: 'from-stone-500/20', to: 'to-amber-500/10' },
  },
  {
    key: 'baby',
    Icon: Baby,
    accent: { from: 'from-sky-500/20', to: 'to-blue-400/10' },
  },
  {
    key: 'books',
    Icon: BookOpen,
    accent: { from: 'from-teal-500/20', to: 'to-cyan-500/10' },
  },
  {
    key: 'electronics',
    Icon: Zap,
    accent: { from: 'from-yellow-500/20', to: 'to-amber-500/10' },
  },
  {
    key: 'watches',
    Icon: Watch,
    accent: { from: 'from-slate-500/20', to: 'to-gray-500/10' },
  },
];
