export interface PolicyRule {
  id: string;
  rule_type: string;
  value_numeric?: number;
  error_message: string;
  severity: 'ERROR' | 'WARNING';
  active: boolean;
}

export interface Claim {
  id: string;
  case_number: string;
  pnr: string;
  passenger_name: string;
  email: string;
  total_amount: number;
  currency: string;
  status: string;
  validation_flags: any;
  created_at: Date;
}

export interface OCRData {
  merchantName: string;
  totalAmount: number;
  currency: string;
  category: string;
  lineItems: string[];
  overallConfidence: number;
  rawText: string;
}

export interface Expense {
  id: string;
  claim_id: string;
  category: string;
  amount: number;
  date: string;
  merchant: string;
  line_items?: string[];
  is_alcohol?: boolean;
  is_entertainment?: boolean;
  ocr_data?: OCRData;
  created_at: Date;
}

export interface RuleEvaluationResult {
  errors: string[];
  warnings: string[];
}

export interface DisruptionPeriod {
  startDate: string;
  endDate: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: Date;
}

export interface Case {
  id: string;
  case_number: string;
  title: string;
  contact_id: string;
  pnr: string;
  flight_number: string;
  disruption_date: string;
  total_amount: number;
  currency: string;
  status: 'New' | 'Pending Review' | 'Approved' | 'Rejected';
  priority: 'Normal' | 'High';
  validation_flags: any;
  created_at: Date;
}

export interface ExpenseLine {
  id: string;
  case_id: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  merchant: string;
  receipt_url: string;
  ocr_confidence: number;
  validation_status: 'Pass' | 'Warning' | 'Fail';
  created_at: Date;
}

export interface Attachment {
  id: string;
  case_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_at: Date;
}

export interface SubmitClaimRequest {
  pnr: string;
  passenger: {
    name: string;
    email: string;
    phone: string;
  };
  flight: {
    flightNumber: string;
    disruptionDate: string;
    origin?: string;
    destination?: string;
  };
  expenses: {
    category: string;
    amount: number;
    date: string;
    merchant: string;
    receipt_url: string;
    ocr_confidence: number;
    validation_status: 'Pass' | 'Warning' | 'Fail';
    ocr_data: OCRData;
  }[];
  totalAmount: number;
  validationResult: {
    errors: string[];
    warnings: string[];
  };
}
