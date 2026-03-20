import React from 'react';
import { cn } from '../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  isLoading,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]';
  
  const variants = {
    primary: 'bg-primary-gold text-white hover:bg-[#B5963A] shadow-md active:scale-95',
    secondary: 'border-2 border-primary-gold text-primary-gold bg-transparent hover:bg-light-beige active:scale-95',
    tertiary: 'text-dark-brown hover:underline px-2',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};
