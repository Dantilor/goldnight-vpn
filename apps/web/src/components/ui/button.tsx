import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

function variantClassName(variant: Variant): string {
  if (variant === 'secondary') {
    return 'bg-[var(--gn-surface-highest)] text-slate-100 hover:bg-slate-700 border border-[var(--gn-outline-soft)]';
  }
  if (variant === 'ghost') {
    return 'bg-transparent text-slate-300 hover:bg-slate-800';
  }
  return 'gn-gold-gradient text-[#3c2f00] hover:brightness-95 shadow-[0_10px_20px_rgba(242,202,80,0.15)]';
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>) {
  return (
    <button
      type="button"
      className={`h-10 rounded-xl px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClassName(variant)} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
