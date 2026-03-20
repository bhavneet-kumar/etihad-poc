import type { Claim, ClaimStatus, Expense, TimelineStep } from '../types';

/** Backend list item (includes server-computed UI hints) */
export interface ApiClaimListItem {
  id: string;
  case_number: string;
  pnr: string;
  passenger_name?: string;
  flight_number?: string;
  disruption_date?: string;
  origin?: string | null;
  destination?: string | null;
  total_amount: number;
  status: string;
  status_key?: string;
  show_admin_review_actions?: boolean;
  created_at: string;
}

export interface ApiTimelineStep {
  label: string;
  timestamp: string;
  step_status: 'completed' | 'active' | 'pending';
}

/** Backend detail — presentation fields from server */
export interface ApiClaimDetail {
  id?: string;
  success?: boolean;
  case_number: string;
  pnr: string;
  flight_number?: string;
  disruption_date?: string;
  origin?: string | null;
  destination?: string | null;
  total_amount: number;
  status: string;
  status_key?: string;
  show_admin_review_actions?: boolean;
  created_at: string;
  timeline_steps?: ApiTimelineStep[];
  expenses?: Array<{
    id: string;
    category: string;
    amount: number;
    date: string;
    merchant: string;
    receipt_url?: string;
    ocr_confidence?: number;
    confidence_band?: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  contact?: { name?: string; email?: string } | null;
}

function bandToLabel(band?: string): 'High' | 'Medium' | 'Low' {
  const u = (band || '').toUpperCase();
  if (u === 'HIGH') return 'High';
  if (u === 'MEDIUM') return 'Medium';
  return 'Low';
}

export function mapApiClaimListToClaims(data: ApiClaimListItem[]): Claim[] {
  return data.map((c) => ({
    id: c.id,
    caseNumber: c.case_number,
    pnr: c.pnr,
    passengerName: c.passenger_name ?? 'N/A',
    email: '',
    flightDetails: {
      flightNumber: c.flight_number ?? 'N/A',
      origin: c.origin || 'N/A',
      destination: c.destination || 'N/A',
      departureDate: c.disruption_date ?? 'N/A',
      status: c.status,
    },
    expenses: [],
    totalAmount: Number(c.total_amount),
    status: (c.status_key || toStatusKey(c.status)) as ClaimStatus,
    submissionDate: new Date(c.created_at).toLocaleString(),
    createdAt: c.created_at,
    timeline: [],
    showAdminReviewActions: c.show_admin_review_actions,
  }));
}

export function mapApiClaimDetailToClaim(data: ApiClaimDetail): Claim {
  const expenses: Expense[] = (data.expenses ?? []).map((e) => ({
    id: e.id,
    category: e.category,
    amount: Number(e.amount),
    date: e.date,
    merchant: e.merchant,
    confidence: bandToLabel(e.confidence_band),
    fileName: e.receipt_url?.startsWith('data:') ? 'Receipt' : e.receipt_url?.split('/').pop(),
    receiptUrl: e.receipt_url,
  }));

  const timeline: TimelineStep[] = (data.timeline_steps ?? []).map((t) => ({
    label: t.label,
    timestamp: t.timestamp,
    status: t.step_status,
  }));

  return {
    id: (data.id as string) || String(data.case_number),
    caseNumber: data.case_number,
    pnr: data.pnr,
    passengerName: data.contact?.name ?? 'N/A',
    email: data.contact?.email ?? 'N/A',
    flightDetails: {
      flightNumber: data.flight_number ?? 'N/A',
      origin: data.origin || 'N/A',
      destination: data.destination || 'N/A',
      departureDate: data.disruption_date ?? 'N/A',
      status: data.status,
    },
    expenses,
    totalAmount: Number(data.total_amount),
    status: (data.status_key || toStatusKey(data.status)) as ClaimStatus,
    submissionDate: new Date(data.created_at).toLocaleString(),
    createdAt: data.created_at,
    timeline,
    showAdminReviewActions: data.show_admin_review_actions,
  };
}

function toStatusKey(status: string): string {
  return status.toUpperCase().replace(/\s+/g, '_');
}
