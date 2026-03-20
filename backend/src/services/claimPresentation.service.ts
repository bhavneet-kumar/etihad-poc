/**
 * Server-side display DTOs only — no business rules beyond formatting case data for UI.
 * Confidence bands and timeline steps are derived from persisted/server state for consistency.
 */

export type ConfidenceBand = 'HIGH' | 'MEDIUM' | 'LOW';

export function confidenceBandFromOcrScore(score: number | null | undefined): ConfidenceBand {
  const s = Number(score);
  if (s >= 0.85) return 'HIGH';
  if (s >= 0.6) return 'MEDIUM';
  return 'LOW';
}

export function statusKeyFromDb(status: string): string {
  return String(status || '')
    .toUpperCase()
    .replace(/\s+/g, '_');
}

/** Admin may act when case is not in a terminal state */
export function showAdminReviewActions(status: string): boolean {
  const s = statusKeyFromDb(status);
  return ['PENDING_REVIEW', 'SUBMITTED', 'NEW', 'HIGH_PRIORITY', 'UNDER_REVIEW'].includes(s);
}

export interface TimelineStepDto {
  label: string;
  timestamp: string;
  step_status: 'completed' | 'active' | 'pending';
}

export function buildClaimTimeline(caseStatus: string, createdAt: string | Date): TimelineStepDto[] {
  const created = typeof createdAt === 'string' ? createdAt : createdAt.toISOString();
  const submittedLabel = new Date(created).toLocaleString();
  const approved = caseStatus === 'Approved';
  const rejected = caseStatus === 'Rejected';

  return [
    { label: 'Claim Submitted', timestamp: submittedLabel, step_status: 'completed' },
    {
      label: 'Initial Review',
      timestamp: approved || rejected ? 'Completed' : 'In Progress',
      step_status: approved || rejected ? 'completed' : 'active',
    },
    {
      label: 'Final Decision',
      timestamp: approved || rejected ? (approved ? 'Approved' : 'Rejected') : '—',
      step_status: approved || rejected ? 'completed' : 'pending',
    },
  ];
}

export function enrichExpenseRow(row: Record<string, unknown>) {
  const conf = row.ocr_confidence as number | null | undefined;
  return {
    ...row,
    confidence_band: confidenceBandFromOcrScore(conf),
  };
}

export function enrichCaseListRow(row: Record<string, unknown>) {
  const status = String(row.status ?? '');
  return {
    ...row,
    status_key: statusKeyFromDb(status),
    show_admin_review_actions: showAdminReviewActions(status),
  };
}
