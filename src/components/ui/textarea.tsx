import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm text-foreground',
      'placeholder:text-muted-foreground transition-[border-color,box-shadow,background-color] duration-150',
      'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60',
      'aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export { Textarea };
