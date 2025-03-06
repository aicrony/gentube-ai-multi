import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './Input.module.css';

type As = 'input' | 'textarea' | 'text';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  as?: As;
}

const Input = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  InputProps
>(({ className, type, as, ...props }, ref) => {
  // Handle 'textarea' or 'text' as types that should render a textarea
  if (as === 'textarea' || as === 'text') {
    return (
      <textarea
        className={cn(styles.root, className)}
        ref={ref as React.ForwardedRef<HTMLTextAreaElement>}
        {...props}
      />
    );
  }

  return (
    <input
      type={type}
      className={cn(styles.root, className)}
      ref={ref as React.ForwardedRef<HTMLInputElement>}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
