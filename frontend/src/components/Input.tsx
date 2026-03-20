import React from 'react';
import { cn } from '../utils/cn';

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }> = ({
  label,
  error,
  className,
  ...props
}) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="block text-xs font-bold uppercase tracking-wider text-dark-brown">{label}</label>}
    <input
      className={cn(
        'w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition-premium focus:border-primary-gold focus:ring-1 focus:ring-primary-gold',
        error && 'border-error focus:border-error focus:ring-error',
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-error font-medium mt-1">{error}</p>}
  </div>
);
