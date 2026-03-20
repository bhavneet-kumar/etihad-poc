import React from 'react';
import { cn } from '../utils/cn';

export const Badge: React.FC<{ children: React.ReactNode; variant?: 'success' | 'warning' | 'error' | 'neutral' }> = ({
  children,
  variant = 'neutral',
}) => {
  const variants = {
    success: 'bg-emerald-50 text-success border-emerald-100',
    warning: 'bg-amber-50 text-primary-gold border-amber-100',
    error: 'bg-rose-50 text-error border-rose-100',
    neutral: 'bg-stone-50 text-stone-700 border-stone-100',
  };
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border', variants[variant])}>
      {children}
    </span>
  );
};
