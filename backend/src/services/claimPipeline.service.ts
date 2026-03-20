import type { Express } from 'express';
import { z } from 'zod';
import { ocrService } from './ocr.service';
import { ruleEngineService } from './ruleEngine.service';
import { claimRepository } from '../repositories/claim.repository';
import { caseService } from './case.service';
import type { Expense, OCRData, SubmitClaimRequest } from '../types/claim';
import { confidenceBandFromOcrScore } from './claimPresentation.service';

const bookingSchema = z.object({
  pnr: z.string().trim().length(6, 'PNR must be exactly 6 characters'),
  lastName: z.string().trim().min(1, 'Last name is required'),
});

const flightDetailsSchema = z.object({
  flightNumber: z.string().min(1),
  origin: z.string().optional(),
  destination: z.string().optional(),
  departureDate: z.string().min(1),
  status: z.string().optional(),
});

const submitMetadataSchema = z.object({
  pnr: z.string().trim().length(6),
  passengerName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  flightDetails: flightDetailsSchema,
});

export type PreviewExpense = {
  fileName: string;
  merchantName: string;
  amount: number;
  date: string;
  category: string;
  overallConfidence: number;
  confidence_band: 'HIGH' | 'MEDIUM' | 'LOW';
  lineItems: string[];
  rawTextPreview: string;
};

function dataUrlFromFile(file: Express.Multer.File): string {
  const b64 = file.buffer.toString('base64');
  const mime = file.mimetype || 'image/jpeg';
  return `data:${mime};base64,${b64}`;
}

function validationStatusFromConfidence(confidence: number): 'Pass' | 'Warning' | 'Fail' {
  if (confidence >= 0.85) return 'Pass';
  if (confidence >= 0.55) return 'Warning';
  return 'Fail';
}

export async function validateBooking(pnr: string, lastName: string) {
  const parsed = bookingSchema.safeParse({ pnr, lastName });
  if (!parsed.success) {
    return {
      ok: false as const,
      error: 'Validation failed',
      details: parsed.error.flatten(),
    };
  }
  const p = parsed.data.pnr.toUpperCase();
  if (p === 'ERROR') {
    return {
      ok: false as const,
      error: 'Invalid PNR. Please check your booking reference and try again.',
    };
  }
  return {
    ok: true as const,
    flightDetails: {
      flightNumber: 'EY101',
      origin: 'Abu Dhabi (AUH)',
      destination: 'London (LHR)',
      departureDate: '2024-03-15',
      status: 'Delayed (4h 15m)',
    },
    passengerName: 'Aionos Test',
  };
}

export async function previewReceiptsFromFiles(
  files: Express.Multer.File[]
): Promise<{
  ok: true;
  expenses: PreviewExpense[];
  totalAmount: number;
  warnings: string[];
} | { ok: false; error: string; details?: string[] }> {
  if (!files?.length) {
    return { ok: false, error: 'No receipt files provided', details: ['Upload at least one receipt image.'] };
  }

  const expenses: PreviewExpense[] = [];
  const warnings: string[] = [];

  for (const file of files) {
    if (!file.mimetype?.startsWith('image/')) {
      return {
        ok: false,
        error: `Unsupported file type: ${file.originalname}`,
        details: ['Only image receipts (JPEG, PNG, WebP) are supported for OCR.'],
      };
    }

    const result = await ocrService.extractFromImage(file.buffer, file.mimetype);
    if ('error' in result) {
      return {
        ok: false,
        error: `Could not read receipt: ${file.originalname}`,
        details: [result.error],
      };
    }

    const o = result.ocr_data;
    if (o.overallConfidence < 0.85) {
      warnings.push(`Low confidence for "${file.originalname}" — manual review may be required.`);
    }

    expenses.push({
      fileName: file.originalname,
      merchantName: o.merchantName,
      amount: o.totalAmount,
      date: result.date || new Date().toISOString().split('T')[0],
      category: o.category,
      overallConfidence: o.overallConfidence,
      confidence_band: confidenceBandFromOcrScore(o.overallConfidence),
      lineItems: o.lineItems,
      rawTextPreview: o.rawText.slice(0, 500),
    });
  }

  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
  return { ok: true, expenses, totalAmount, warnings };
}

export async function submitClaimWithReceiptFiles(
  meta: z.infer<typeof submitMetadataSchema>,
  files: Express.Multer.File[]
): Promise<
  | {
      success: true;
      caseNumber: string;
      status: string;
      estimatedProcessingDays: number;
      submissionDate: string;
      totalAmount: number;
      warnings: string[];
      expenseCount: number;
    }
  | { success: false; error: string; errors?: string[]; warnings?: string[] }
> {
  const parsed = submitMetadataSchema.safeParse(meta);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid claim metadata',
      errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    };
  }

  const m = parsed.data;
  if (!files?.length) {
    return { success: false, error: 'No receipts uploaded', errors: ['Attach at least one receipt.'] };
  }

  const builtExpenses: SubmitClaimRequest['expenses'] = [];
  const warnings: string[] = [];

  for (const file of files) {
    if (!file.mimetype?.startsWith('image/')) {
      return {
        success: false,
        error: 'Invalid receipt file',
        errors: [`${file.originalname} is not a supported image.`],
      };
    }

    const result = await ocrService.extractFromImage(file.buffer, file.mimetype);
    if ('error' in result) {
      return {
        success: false,
        error: 'Receipt OCR failed',
        errors: [`${file.originalname}: ${result.error}`],
      };
    }

    const o: OCRData = result.ocr_data;
    const cat = o.category.trim().toLowerCase();
    const conf = o.overallConfidence;
    if (conf < 0.85) {
      warnings.push(`Low OCR confidence for ${o.merchantName} (${file.originalname}).`);
    }

    builtExpenses.push({
      category: cat,
      amount: o.totalAmount,
      date: result.date || new Date().toISOString().split('T')[0],
      merchant: o.merchantName,
      receipt_url: dataUrlFromFile(file),
      ocr_confidence: conf,
      validation_status: validationStatusFromConfidence(conf),
      ocr_data: {
        merchantName: o.merchantName,
        totalAmount: o.totalAmount,
        currency: o.currency,
        category: cat,
        lineItems: o.lineItems.length > 0 ? o.lineItems : ['(no line items extracted)'],
        overallConfidence: conf,
        rawText: o.rawText || '',
      },
    });
  }

  const totalAmount = builtExpenses.reduce((s, e) => s + e.amount, 0);

  const claimData: SubmitClaimRequest = {
    pnr: m.pnr.trim().toUpperCase(),
    passenger: {
      name: m.passengerName,
      email: m.email,
      phone: m.phone ?? '',
    },
    flight: {
      flightNumber: m.flightDetails.flightNumber,
      disruptionDate: m.flightDetails.departureDate,
      origin: m.flightDetails.origin,
      destination: m.flightDetails.destination,
    },
    expenses: builtExpenses,
    totalAmount,
    validationResult: { errors: [], warnings: [] },
  };

  const rules = await claimRepository.getActiveRules();
  const disruptionPeriod = {
    startDate: claimData.flight.disruptionDate,
    endDate: claimData.flight.disruptionDate,
  };

  const internalExpenses: Partial<Expense>[] = claimData.expenses.map((exp) => ({
    category: exp.category,
    amount: exp.amount,
    date: exp.date,
    merchant: exp.merchant,
    ocr_data: exp.ocr_data,
    line_items: exp.ocr_data.lineItems,
  }));

  const evaluation = ruleEngineService.evaluateRules(
    { total_amount: claimData.totalAmount },
    internalExpenses,
    rules,
    disruptionPeriod
  );

  if (evaluation.errors.length > 0) {
    return {
      success: false,
      error: 'Claim did not pass policy checks',
      errors: evaluation.errors,
      warnings: [...warnings, ...evaluation.warnings],
    };
  }

  const result = await caseService.createClaim({
    ...claimData,
    validationResult: {
      errors: evaluation.errors,
      warnings: [...warnings, ...evaluation.warnings],
    },
  });

  return {
    success: true,
    caseNumber: result.caseNumber,
    status: result.status,
    estimatedProcessingDays: result.estimatedProcessingDays,
    submissionDate: new Date().toISOString(),
    totalAmount,
    warnings: [...warnings, ...evaluation.warnings],
    expenseCount: builtExpenses.length,
  };
}
