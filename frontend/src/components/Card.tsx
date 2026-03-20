import React from 'react';
import { cn } from '../utils/cn';

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({
  children,
  className,
  onClick,
}) => (
  <div 
    onClick={onClick}
    className={cn('bg-white rounded-lg shadow-card border border-border p-6 transition-premium', className, onClick && 'cursor-pointer hover:shadow-hover')}
  >
    {children}
  </div>
);
