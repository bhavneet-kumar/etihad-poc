import React from 'react';
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { ClaimStatus } from '../types';

export type BadgeVariant = 'success' | 'error' | 'warning' | 'neutral';

export function getStatusVariant(status: ClaimStatus): BadgeVariant {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
    case 'HIGH_PRIORITY':
      return 'error';
    case 'PENDING_REVIEW':
    case 'UNDER_REVIEW':
      return 'warning';
    case 'SUBMITTED':
    case 'NEW':
    default:
      return 'neutral';
  }
}

export function getStatusIcon(status: ClaimStatus): React.ReactNode {
  switch (status) {
    case 'APPROVED':
      return <CheckCircle2 className="h-6 w-6 text-success" />;
    case 'REJECTED':
      return <XCircle className="h-6 w-6 text-error" />;
    case 'PENDING_REVIEW':
      return <Clock className="h-6 w-6 text-primary-gold" />;
    case 'SUBMITTED':
    default:
      return <AlertCircle className="h-6 w-6 text-stone-400" />;
  }
}

export function formatStatusLabel(status: ClaimStatus): string {
  return status.replace(/_/g, ' ');
}
