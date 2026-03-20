import React from 'react';
import { cn } from '../utils/cn';

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const normalizedStatus = status.toUpperCase().replace(' ', '_');
  
  const config: Record<string, { label: string; className: string }> = {
    SUBMITTED: { label: 'Submitted', className: 'bg-stone-100 text-stone-600 border-stone-200' },
    UNDER_REVIEW: { label: 'Under Review', className: 'bg-amber-50 text-primary-gold border-amber-200' },
    APPROVED: { label: 'Approved', className: 'bg-emerald-50 text-success border-emerald-200' },
    REJECTED: { label: 'Rejected', className: 'bg-rose-50 text-error border-rose-200' },
    PENDING_REVIEW: { label: 'Pending Review', className: 'bg-amber-50 text-primary-gold border-amber-200' },
    HIGH_PRIORITY: { label: 'High Priority', className: 'bg-rose-50 text-error border-rose-200' },
  };

  const { label, className } = config[normalizedStatus] || { label: status, className: 'bg-stone-50 text-stone-400 border-stone-100' };

  return (
    <span className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border', className)}>
      {label}
    </span>
  );
};
