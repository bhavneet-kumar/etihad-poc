import { query, execute } from '../config/db';
import { PolicyRule } from '../types/claim';

export interface CaseListItem {
  id: string;
  case_number: string;
  pnr: string;
  passenger_name: string;
  flight_number: string;
  disruption_date: string;
  origin?: string | null;
  destination?: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

export interface CaseDetailRow {
  id: string;
  case_number: string;
  pnr: string;
  flight_number: string;
  disruption_date: string;
  origin?: string | null;
  destination?: string | null;
  contact_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

export class ClaimRepository {
  public async getActiveRules(): Promise<PolicyRule[]> {
    const rows = await query('SELECT * FROM policy_rules WHERE active = true');
    return rows as PolicyRule[];
  }

  public async getClaims(): Promise<CaseListItem[]> {
    const rows = await query(`
      SELECT c.id, c.case_number, c.pnr, c.flight_number, c.disruption_date, c.origin, c.destination, c.total_amount, c.status, c.created_at,
             ct.name as passenger_name
      FROM cases c
      LEFT JOIN contacts ct ON c.contact_id = ct.id
      ORDER BY c.created_at DESC
    `);
    return rows as CaseListItem[];
  }

  public async getClaimsForCustomerEmail(customerEmail: string): Promise<CaseListItem[]> {
    const rows = await query(
      `
      SELECT c.id, c.case_number, c.pnr, c.flight_number, c.disruption_date, c.origin, c.destination, c.total_amount, c.status, c.created_at,
             ct.name as passenger_name
      FROM cases c
      INNER JOIN contacts ct ON c.contact_id = ct.id
      WHERE LOWER(TRIM(ct.email)) = LOWER(TRIM($1))
      ORDER BY c.created_at DESC
    `,
      [customerEmail]
    );
    return rows as CaseListItem[];
  }

  public async getClaimDetail(id: string): Promise<{ case: CaseDetailRow; expenses: unknown[]; attachments: unknown[]; contact: unknown } | null> {
    const cases = await query('SELECT * FROM cases WHERE id = $1', [id]);
    if (cases.length === 0) return null;

    const caseData = cases[0] as CaseDetailRow;
    const expenses = await query('SELECT * FROM expense_lines WHERE case_id = $1 ORDER BY created_at ASC', [id]);
    const attachments = await query('SELECT * FROM attachments WHERE case_id = $1 ORDER BY uploaded_at ASC', [id]);
    const contactRows = await query('SELECT * FROM contacts WHERE id = $1', [caseData.contact_id]);

    return {
      case: caseData,
      expenses,
      attachments,
      contact: contactRows[0] ?? null,
    };
  }

  public async updateCaseStatus(id: string, status: string): Promise<boolean> {
    const result = await execute('UPDATE cases SET status = $1 WHERE id = $2', [status, id]);
    return (result.rowCount ?? 0) > 0;
  }

  public async createCase(caseData: any): Promise<void> {
    await execute(
      `INSERT INTO cases (id, case_number, pnr, flight_number, disruption_date, contact_id, total_amount, currency, status, priority, validation_flags, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, now())`,
      [
        caseData.id,
        caseData.case_number,
        caseData.pnr,
        caseData.flight_number,
        caseData.disruption_date,
        caseData.contact_id,
        caseData.total_amount,
        caseData.currency || 'USD',
        caseData.status,
        caseData.priority,
        JSON.stringify(caseData.validation_flags || {}),
      ]
    );
  }

  public async createExpenseLine(expense: {
    id: string;
    case_id: string;
    category: string;
    amount: number;
    currency?: string;
    date: string;
    merchant: string;
    ocr_confidence: number;
    validation_status: string;
  }): Promise<void> {
    await execute(
      `INSERT INTO expense_lines (id, case_id, category, amount, currency, date, merchant, ocr_confidence, validation_status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())`,
      [
        expense.id,
        expense.case_id,
        expense.category,
        expense.amount,
        expense.currency || 'USD',
        expense.date,
        expense.merchant,
        expense.ocr_confidence,
        expense.validation_status,
      ]
    );
  }

  public async createAttachment(attachment: {
    id: string;
    case_id: string;
    file_name: string;
    file_url: string;
    file_type: string;
  }): Promise<void> {
    await execute(
      `INSERT INTO attachments (id, case_id, file_name, file_url, file_type, uploaded_at)
       VALUES ($1, $2, $3, $4, $5, now())`,
      [attachment.id, attachment.case_id, attachment.file_name, attachment.file_url, attachment.file_type]
    );
  }
}

export const claimRepository = new ClaimRepository();
