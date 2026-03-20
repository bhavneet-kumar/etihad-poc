export type ClaimStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'PENDING_REVIEW' | 'HIGH_PRIORITY' | 'NEW' | 'APPROVED' | 'REJECTED';

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  merchant: string;
  confidence: 'High' | 'Medium' | 'Low';
  fileName?: string;
  /** Receipt image URL (data URL or external) for "view" action */
  receiptUrl?: string;
  ocr_data?: {
    merchantName: string;
    totalAmount: number;
    currency: string;
    category: string;
    lineItems: string[];
    overallConfidence: number;
    rawText: string;
  };
}

export interface FlightDetails {
  flightNumber: string;
  origin: string;
  destination: string;
  departureDate: string;
  status: string;
}

export interface Claim {
  id: string;
  caseNumber: string;
  pnr: string;
  passengerName: string;
  email: string;
  /** Last name used for PNR validation step only (form state) */
  lastName?: string;
  /** Contact phone (form state) */
  phone?: string;
  flightDetails: FlightDetails | null;
  expenses: Expense[];
  totalAmount: number;
  status: ClaimStatus;
  submissionDate: string;
  timeline: TimelineStep[];
  createdAt: string;
  /** From API — whether admin review actions apply */
  showAdminReviewActions?: boolean;
}

export interface TimelineStep {
  label: string;
  timestamp: string;
  status: 'completed' | 'active' | 'pending';
  icon?: string;
}
