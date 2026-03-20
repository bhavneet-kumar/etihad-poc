/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { claimRepository } from '../repositories/claim.repository';
import {
  validateBooking as validateBookingPipeline,
  previewReceiptsFromFiles,
  submitClaimWithReceiptFiles,
} from '../services/claimPipeline.service';
import {
  enrichCaseListRow,
  enrichExpenseRow,
  buildClaimTimeline,
  statusKeyFromDb,
  showAdminReviewActions,
} from '../services/claimPresentation.service';

export class ClaimController {
  /**
   * POST /api/claims/validate-booking
   * JSON: { pnr, lastName } — server-side validation + flight lookup (demo).
   */
  public async validateBooking(req: Request, res: Response) {
    try {
      const { pnr, lastName } = req.body || {};
      const result = await validateBookingPipeline(
        typeof pnr === 'string' ? pnr : '',
        typeof lastName === 'string' ? lastName : ''
      );
      if (!result.ok) {
        const errs =
          'details' in result && result.details
            ? Array.isArray(result.details)
              ? result.details
              : [JSON.stringify(result.details)]
            : [result.error];
        return res.status(400).json({
          success: false,
          caseNumber: null,
          status: null,
          errors: errs,
          warnings: [],
        });
      }
      return res.json({
        success: true,
        caseNumber: null,
        status: null,
        errors: [],
        warnings: [],
        flightDetails: result.flightDetails,
        passengerName: result.passengerName,
      });
    } catch (error) {
      console.error('validateBooking error:', error);
      return res.status(500).json({
        success: false,
        caseNumber: null,
        status: null,
        errors: ['Internal server error'],
        warnings: [],
      });
    }
  }

  /**
   * POST /api/claims/preview-receipts
   * Multipart: receipts[] — OCR only, for review UI (no persistence, no rule engine).
   */
  public async previewReceipts(req: Request, res: Response) {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      const result = await previewReceiptsFromFiles(files || []);
      if (!result.ok) {
        return res.status(400).json({
          success: false,
          caseNumber: null,
          status: null,
          errors: result.details || [result.error],
          warnings: [],
        });
      }
      return res.json({
        success: true,
        caseNumber: null,
        status: null,
        errors: [],
        warnings: result.warnings,
        expenses: result.expenses,
        totalAmount: result.totalAmount,
      });
    } catch (error) {
      console.error('previewReceipts error:', error);
      return res.status(500).json({
        success: false,
        caseNumber: null,
        status: null,
        errors: ['Internal server error'],
        warnings: [],
      });
    }
  }

  /**
   * POST /api/claims/submit-with-receipts
   * Multipart: receipts[] + pnr, passengerName, email, phone?, flightDetails (JSON string).
   * Full pipeline: OCR → validation → rule engine → persist.
   */
  public async submitWithReceipts(req: Request, res: Response) {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      let flightDetails: unknown;
      try {
        flightDetails = JSON.parse(String(req.body.flightDetails || '{}'));
      } catch {
        return res.status(400).json({
          success: false,
          caseNumber: null,
          status: null,
          errors: ['Invalid flightDetails JSON'],
          warnings: [],
        });
      }

      const user = req.user;
      const contactEmail =
        user?.role === 'customer' && user?.email
          ? user.email
          : String(req.body.email || '');
      const started = Date.now();
      const result = await submitClaimWithReceiptFiles(
        {
          pnr: String(req.body.pnr || ''),
          passengerName: String(req.body.passengerName || ''),
          email: contactEmail,
          phone: req.body.phone ? String(req.body.phone) : undefined,
          flightDetails: flightDetails as any,
        },
        files || []
      );

      res.setHeader('X-Process-Time-Ms', String(Date.now() - started));

      if (!result.success) {
        return res.status(400).json({
          success: false,
          caseNumber: null,
          status: null,
          errors: result.errors || [result.error],
          warnings: result.warnings || [],
        });
      }

      return res.status(201).json({
        success: true,
        caseNumber: result.caseNumber,
        status: result.status,
        errors: [],
        warnings: result.warnings,
        estimatedProcessingDays: result.estimatedProcessingDays,
        submissionDate: result.submissionDate,
        totalAmount: result.totalAmount,
        expenseCount: result.expenseCount,
      });
    } catch (error) {
      console.error('submitWithReceipts error:', error);
      return res.status(500).json({
        success: false,
        caseNumber: null,
        status: null,
        errors: ['Internal server error'],
        warnings: [],
      });
    }
  }

  /**
   * JSON body claim submit removed — bypasses server OCR. Use submit-with-receipts only.
   */
  public submitClaimJsonDisabled(_req: Request, res: Response) {
    return res.status(410).json({
      success: false,
      caseNumber: null,
      status: null,
      errors: [
        'Claim creation via JSON is disabled. Use POST /api/claims/submit-with-receipts with multipart receipt files so OCR and rules run on the server.',
      ],
      warnings: [],
    });
  }

  public async getClaims(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const rows =
        user.role === 'admin'
          ? await claimRepository.getClaims()
          : await claimRepository.getClaimsForCustomerEmail(user.email);
      return res.json(rows.map((r) => enrichCaseListRow(r as Record<string, unknown>)));
    } catch (error) {
      console.error('Error fetching claims:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  public async getClaimDetail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const detail = await claimRepository.getClaimDetail(id);
      if (!detail) {
        return res.status(404).json({
          success: false,
          caseNumber: null,
          status: null,
          errors: ['Claim not found'],
          warnings: [],
        });
      }
      const user = req.user;
      if (user && user.role !== 'admin') {
        const contact = detail.contact as { email?: string } | null;
        const claimEmail = (contact?.email || '').trim().toLowerCase();
        if (!claimEmail || claimEmail !== user.email.toLowerCase()) {
          return res.status(403).json({
            success: false,
            caseNumber: null,
            status: null,
            errors: ['Forbidden'],
            warnings: [],
          });
        }
      }
      const c = detail.case as Record<string, unknown>;
      const status = String(c.status ?? '');
      const expenses = detail.expenses as Record<string, unknown>[];
      const attachments = (detail.attachments as Array<{ file_url?: string }>) || [];
      const expensesWithReceipts = expenses.map((e, i) => {
        const enriched = enrichExpenseRow(e) as Record<string, unknown>;
        if (!enriched.receipt_url && attachments[i]?.file_url) {
          enriched.receipt_url = attachments[i].file_url;
        }
        return enriched;
      });
      return res.json({
        ...c,
        success: true,
        caseNumber: c.case_number,
        status,
        errors: [] as string[],
        warnings: [] as string[],
        status_key: statusKeyFromDb(status),
        show_admin_review_actions: showAdminReviewActions(status),
        timeline_steps: buildClaimTimeline(status, String(c.created_at)),
        expenses: expensesWithReceipts,
        attachments: detail.attachments,
        contact: detail.contact,
      });
    } catch (error) {
      console.error('Error fetching claim detail:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  public async updateClaimStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['Approved', 'Rejected', 'Pending Review', 'High Priority'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const updated = await claimRepository.updateCaseStatus(id, status);
      if (!updated) {
        return res.status(404).json({
          success: false,
          caseNumber: null,
          status: null,
          errors: ['Claim not found'],
          warnings: [],
        });
      }
      return res.json({
        success: true,
        caseNumber: null,
        status,
        errors: [],
        warnings: [],
      });
    } catch (error) {
      console.error('Error updating claim status:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const claimController = new ClaimController();
