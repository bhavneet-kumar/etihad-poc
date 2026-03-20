import { withTransaction } from '../config/db';
import { v4 as uuidv4 } from 'uuid';
import { SubmitClaimRequest } from '../types/claim';
import { generateCaseNumber } from '../utils/generateCaseNumber';
import { sendConfirmationEmail } from './email.service';

export class CaseService {
  public async createClaim(claimData: SubmitClaimRequest) {
    try {
      // 2. Generate Case Number (outside tx is fine for this POC)
      const caseNumber = await generateCaseNumber();

      // 3. Determine Case Status (Routing Logic)
      let status: 'New' | 'Pending Review' | 'Approved' | 'Rejected' = 'Pending Review';
      let priority: 'Normal' | 'High' = 'Normal';

      const hasWarnings = claimData.validationResult.warnings.length > 0;
      const allHighConfidence = claimData.expenses.every((exp) => exp.ocr_confidence > 0.85);

      if (claimData.totalAmount < 300 && !hasWarnings && allHighConfidence) {
        status = 'Approved';
      } else {
        status = 'Pending Review';
      }

      if (claimData.totalAmount > 800) {
        priority = 'High';
      }

      const caseId = uuidv4();

      await withTransaction(async (client) => {
        // 1. Create or fetch Contact
        let contactId: string;
        const existingContacts = await client.query<{ id: string }>(
          'SELECT id FROM contacts WHERE email = $1',
          [claimData.passenger.email]
        );

        if (existingContacts.rows.length > 0) {
          contactId = existingContacts.rows[0].id;
        } else {
          contactId = uuidv4();
          await client.query(
            'INSERT INTO contacts (id, name, email, phone, created_at) VALUES ($1, $2, $3, $4, now())',
            [contactId, claimData.passenger.name, claimData.passenger.email, claimData.passenger.phone]
          );
        }

        // 4. Create Case
        await client.query(
          `INSERT INTO cases (id, case_number, pnr, flight_number, disruption_date, origin, destination, contact_id, total_amount, currency, status, priority, validation_flags, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, now())`,
          [
            caseId,
            caseNumber,
            claimData.pnr,
            claimData.flight.flightNumber,
            claimData.flight.disruptionDate,
            claimData.flight.origin ?? null,
            claimData.flight.destination ?? null,
            contactId,
            claimData.totalAmount,
            'USD',
            status,
            priority,
            JSON.stringify({ warnings: claimData.validationResult.warnings }),
          ]
        );

        // 5. Create Expense Lines + Attachments
        for (const exp of claimData.expenses) {
          const expenseId = uuidv4();
          await client.query(
            `INSERT INTO expense_lines (id, case_id, category, amount, currency, date, merchant, ocr_confidence, validation_status, receipt_url, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())`,
            [
              expenseId,
              caseId,
              exp.category,
              exp.amount,
              'USD',
              exp.date,
              exp.merchant,
              exp.ocr_confidence,
              exp.validation_status,
              exp.receipt_url || null,
            ]
          );

          if (exp.receipt_url) {
            await client.query(
              `INSERT INTO attachments (id, case_id, file_name, file_url, file_type, uploaded_at)
               VALUES ($1, $2, $3, $4, $5, now())`,
              [uuidv4(), caseId, `Receipt - ${exp.merchant}`, exp.receipt_url, 'image/jpeg']
            );
          }
        }
      });

      // Trigger async email simulation (no await)
      sendConfirmationEmail(caseNumber, claimData).catch(console.error);

      return {
        success: true,
        caseNumber,
        status,
        estimatedProcessingDays: 7,
      };
    } catch (error) {
      console.error('Error in CaseService.createClaim:', error);
      throw error;
    }
  }
}

export const caseService = new CaseService();
