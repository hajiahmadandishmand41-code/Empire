import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm',
        'text-foreground placeholder:text-muted-foreground',
        'transition-[border-color,box-shadow,background-color] duration-150',
        'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60',
        'aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
