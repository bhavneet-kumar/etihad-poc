const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const AUTH_TOKEN_KEY = 'etihad_auth_token';

function authHeaders(json = false): HeadersInit {
  const t = localStorage.getItem(AUTH_TOKEN_KEY);
  const h: Record<string, string> = {};
  if (t) h.Authorization = `Bearer ${t}`;
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

function onUnauthorized(res: Response) {
  if (res.status === 401) {
    window.dispatchEvent(new Event('etihad:auth-expired'));
  }
}

export interface FlightDetailsPayload {
  flightNumber: string;
  origin?: string;
  destination?: string;
  departureDate: string;
  status?: string;
}

export interface PreviewReceiptExpense {
  fileName: string;
  merchantName: string;
  amount: number;
  date: string;
  category: string;
  overallConfidence: number;
  confidence_band: 'HIGH' | 'MEDIUM' | 'LOW';
  lineItems: string[];
  rawTextPreview: string;
}

export const api = {
  async validateBooking(pnr: string, lastName: string) {
    const response = await fetch(`${API_BASE_URL}/claims/validate-booking`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({ pnr, lastName }),
    });
    onUnauthorized(response);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error((data.errors && data.errors[0]) || data.error || 'Validation failed');
    }
    return data as {
      success: boolean;
      flightDetails: FlightDetailsPayload;
      passengerName: string;
      errors?: string[];
    };
  },

  async previewReceipts(files: File[]) {
    const form = new FormData();
    for (const f of files) {
      form.append('receipts', f);
    }
    const response = await fetch(`${API_BASE_URL}/claims/preview-receipts`, {
      method: 'POST',
      headers: authHeaders(false),
      body: form,
    });
    onUnauthorized(response);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = data.details?.join?.(' ') || data.error || 'Failed to analyze receipts';
      throw new Error(msg);
    }
    return data as {
      success: boolean;
      expenses: PreviewReceiptExpense[];
      totalAmount: number;
      warnings: string[];
      errors?: string[];
    };
  },

  async submitClaimWithReceipts(
    files: File[],
    meta: {
      pnr: string;
      email: string;
      passengerName: string;
      phone: string;
      flightDetails: FlightDetailsPayload;
    }
  ) {
    const form = new FormData();
    form.append('pnr', meta.pnr.trim().toUpperCase());
    form.append('email', meta.email);
    form.append('passengerName', meta.passengerName);
    form.append('phone', meta.phone);
    form.append('flightDetails', JSON.stringify(meta.flightDetails));
    for (const f of files) {
      form.append('receipts', f);
    }
    const response = await fetch(`${API_BASE_URL}/claims/submit-with-receipts`, {
      method: 'POST',
      headers: authHeaders(false),
      body: form,
    });
    onUnauthorized(response);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        Array.isArray(data.errors) && data.errors.length > 0
          ? data.errors.join(' ')
          : data.error || 'Failed to submit claim';
      throw new Error(message);
    }
    return data as {
      success: boolean;
      caseNumber?: string | null;
      status?: string | null;
      errors?: string[];
      warnings: string[];
      estimatedProcessingDays: number;
      submissionDate: string;
      totalAmount: number;
      expenseCount: number;
    };
  },

  async getClaims() {
    const response = await fetch(`${API_BASE_URL}/claims`, { headers: authHeaders(false) });
    onUnauthorized(response);
    if (!response.ok) throw new Error('Failed to fetch claims');
    return response.json();
  },

  async getClaimDetail(id: string) {
    const response = await fetch(`${API_BASE_URL}/claims/${id}`, { headers: authHeaders(false) });
    onUnauthorized(response);
    if (!response.ok) throw new Error('Failed to fetch claim detail');
    return response.json();
  },

  async updateClaimStatus(id: string, status: string) {
    const response = await fetch(`${API_BASE_URL}/claims/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(true),
      body: JSON.stringify({ status }),
    });
    onUnauthorized(response);
    if (!response.ok) throw new Error('Failed to update claim status');
    return response.json();
  },
};
