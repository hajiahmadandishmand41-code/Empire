import { describe, expect, it } from 'vitest';
import { buttonVariants } from '@/components/ui/button';
import { iconButtonVariants } from '@/components/ui/icon-button';

const includes = (value: string, token: string) => expect(value.split(/\s+/)).toContain(token);

describe('Empire design system foundations', () => {
  it('keeps Button variants semantic and focus-safe', () => {
    const primary = buttonVariants({ variant: 'primary', size: 'md' });
    const outline = buttonVariants({ variant: 'outline', size: 'lg' });

    includes(primary, 'bg-primary');
    includes(primary, 'text-primary-foreground');
    includes(primary, 'focus-visible:ring-2');
    includes(outline, 'border');
    includes(outline, 'bg-background');
  });

  it('provides predictable IconButton size and variant APIs', () => {
    const icon = iconButtonVariants({ variant: 'ghost', size: 'md' });

    includes(icon, 'size-10');
    includes(icon, 'focus-visible:ring-2');
    includes(icon, '[&_svg]:size-4');
  });
});
