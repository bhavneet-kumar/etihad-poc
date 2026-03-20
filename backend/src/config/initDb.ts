import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { exec, execute, query } from './db';

/**
 * Creates all tables and seeds policy_rules if missing.
 * Safe to call on every startup (idempotent).
 */
export async function initDb(): Promise<void> {
  // One statement at a time for pg.
  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('customer', 'admin')),
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      case_number TEXT UNIQUE NOT NULL,
      pnr TEXT NOT NULL,
      flight_number TEXT NOT NULL,
      disruption_date TEXT NOT NULL,
      origin TEXT,
      destination TEXT,
      contact_id TEXT NOT NULL,
      total_amount DOUBLE PRECISION NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'Normal',
      validation_flags JSONB,
      created_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT fk_cases_contact FOREIGN KEY (contact_id) REFERENCES contacts(id)
    )
  `);

  // If the table existed before we added route fields, ensure they're present.
  await exec(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS origin TEXT`);
  await exec(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS destination TEXT`);

  await exec(`
    CREATE TABLE IF NOT EXISTS expense_lines (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      category TEXT NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      date TEXT NOT NULL,
      merchant TEXT NOT NULL,
      ocr_confidence DOUBLE PRECISION,
      validation_status TEXT NOT NULL,
      receipt_url TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT fk_expense_case FOREIGN KEY (case_id) REFERENCES cases(id)
    )
  `);

  await exec(`ALTER TABLE expense_lines ADD COLUMN IF NOT EXISTS receipt_url TEXT`);

  await exec(`
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_type TEXT NOT NULL,
      uploaded_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT fk_attach_case FOREIGN KEY (case_id) REFERENCES cases(id)
    )
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS policy_rules (
      id TEXT PRIMARY KEY,
      rule_type TEXT NOT NULL,
      value_numeric DOUBLE PRECISION,
      error_message TEXT NOT NULL,
      severity TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true
    )
  `);

  await seedPolicyRules();
  await seedUsers();
}

async function seedUsers(): Promise<void> {
  const rows = await query<{ c: string }>('SELECT COUNT(*)::text as c FROM users');
  if (Number(rows[0]?.c ?? '0') > 0) return;

  const hash = await bcrypt.hash('123456', 10);
  await execute(
    `INSERT INTO users (id, email, password, role, created_at) VALUES ($1, $2, $3, 'customer', now())`,
    [uuidv4(), 'customer@test.com', hash]
  );
  await execute(
    `INSERT INTO users (id, email, password, role, created_at) VALUES ($1, $2, $3, 'admin', now())`,
    [uuidv4(), 'admin@test.com', hash]
  );
}

async function seedPolicyRules(): Promise<void> {
  const rows = await query<{ c: string }>('SELECT COUNT(*)::text as c FROM policy_rules');
  const count = Number(rows[0]?.c ?? '0');
  if (count > 0) return;

  const rules: { id: string; rule_type: string; value_numeric: number | null; error_message: string; severity: string }[] = [
    { id: uuidv4(), rule_type: 'MAX_LIMIT', value_numeric: 6303, error_message: 'Total claim amount exceeds the maximum limit of {limit} USD.', severity: 'ERROR' },
    { id: uuidv4(), rule_type: 'DATE_RANGE', value_numeric: null, error_message: 'One or more expenses fall outside the disruption period.', severity: 'ERROR' },
    { id: uuidv4(), rule_type: 'ENTERTAINMENT_BLOCK', value_numeric: null, error_message: 'Entertainment expenses are not reimbursable.', severity: 'ERROR' },
    { id: uuidv4(), rule_type: 'PHONE_LIMIT', value_numeric: 2, error_message: 'Maximum {limit} communication expenses allowed.', severity: 'WARNING' },
    { id: uuidv4(), rule_type: 'ITEMIZED_REQUIRED', value_numeric: null, error_message: 'Itemized receipts are required for all expenses.', severity: 'WARNING' },
    { id: uuidv4(), rule_type: 'TRANSPORT_DATE_VALIDATION', value_numeric: null, error_message: 'Transport expenses must fall within the disruption period.', severity: 'ERROR' },
  ];

  for (const r of rules) {
    await execute(
      `INSERT INTO policy_rules (id, rule_type, value_numeric, error_message, severity, active)
       VALUES ($1, $2, $3, $4, $5, true)`,
      [r.id, r.rule_type, r.value_numeric, r.error_message, r.severity]
    );
  }
}
