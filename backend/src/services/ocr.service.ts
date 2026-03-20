import type { OCRData } from '../types/claim';
import { GoogleGenerativeAI } from '@google/generative-ai';

const EXTRACTION_PROMPT = `You are a receipt OCR and expense extraction system. Analyze the provided receipt image and return a single JSON object with no markdown or code fences, using exactly these keys:

- merchantName: string (business/vendor name)
- totalAmount: number (grand total as number, e.g. 11.50)
- currency: string (e.g. USD, EUR)
- category: string - one of: transport, meal, accommodation, communication, entertainment, beverage, other
- lineItems: string[] - list of item names or descriptions
- rawText: string - full extracted text from the receipt

Rules:
- If not a receipt → {"error":"not_a_receipt"}
- If unreadable → {"error":"unreadable"}
- Return only valid JSON.`;

export interface ExtractReceiptResult {
  ocr_data: OCRData;
  confidence: number;
  date?: string;
}

export interface ExtractReceiptError {
  error: string;
  confidence: number;
}

const DEFAULT_CONFIDENCE = 0.85;
const LOW_CONFIDENCE = 0.5;

/** Model id for @google/generative-ai (must support generateContent + vision). Override with GEMINI_OCR_MODEL. */
const DEFAULT_GEMINI_OCR_MODEL = 'gemini-2.0-flash';

function getOcrModelName(): string {
  return (process.env.GEMINI_OCR_MODEL || DEFAULT_GEMINI_OCR_MODEL).trim();
}

/** True network/DNS failures — not HTTP 4xx/5xx from the API (those often say "Error fetching from …"). */
function isLikelyNetworkFailure(err: unknown): boolean {
  const e = err as {
    message?: string;
    code?: string;
    syscall?: string;
    errno?: number;
    status?: number;
  };
  if (typeof e.status === 'number' && e.status >= 400) return false;
  const msg = typeof e.message === 'string' ? e.message : '';
  if (
    e.code === 'ENOTFOUND' ||
    e.code === 'ECONNREFUSED' ||
    e.code === 'ETIMEDOUT' ||
    e.code === 'ECONNRESET' ||
    e.syscall === 'getaddrinfo'
  ) {
    return true;
  }
  // Node fetch failures without HTTP status (do not match Google's "Error fetching from" API errors)
  if (/^fetch failed$/i.test(msg.trim()) || /^network request failed$/i.test(msg.trim())) {
    return true;
  }
  return false;
}

function isReceiptError(obj: Record<string, unknown>): obj is { error: string } {
  return typeof obj.error === 'string';
}

function parseNumeric(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const n = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((x) => typeof x === 'string');
  if (typeof value === 'string') return value ? [value] : [];
  return [];
}

function normalizeCategory(cat: unknown): string {
  const s = typeof cat === 'string' ? cat.trim().toLowerCase() : 'other';
  const allowed = ['transport', 'meal', 'accommodation', 'communication', 'entertainment', 'beverage', 'other'];
  return allowed.includes(s) ? s : 'other';
}

export class OCRService {
  private genai: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.error('[OCRService] Missing GEMINI_API_KEY');
      return;
    }

    this.genai = new GoogleGenerativeAI(apiKey);
    console.log('[OCRService] Gemini client initialized, OCR model:', getOcrModelName());
  }

  isAvailable(): boolean {
    return this.genai !== null;
  }

  async extractFromImage(
    imageBuffer: Buffer,
    mimeType: string = 'image/jpeg'
  ): Promise<ExtractReceiptResult | ExtractReceiptError> {
    if (!this.genai) {
      return { error: 'OCR not configured', confidence: 0 };
    }

    const base64 = imageBuffer.toString('base64');

    try {
      const model = this.genai.getGenerativeModel({
        model: getOcrModelName(),
      });

      const result = await model.generateContent([
        EXTRACTION_PROMPT,
        {
          inlineData: {
            mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType,
            data: base64,
          },
        },
      ]);

      const text = result.response.text()?.trim() || '';

      if (!text) {
        return { error: 'Empty OCR response', confidence: LOW_CONFIDENCE };
      }

      // Remove markdown if present
      let jsonStr = text;
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) jsonStr = match[1].trim();

      let parsed: Record<string, unknown>;

      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        console.error('[OCRService] JSON parse failed:', text);
        return { error: 'Invalid JSON from OCR', confidence: 0 };
      }

      if (isReceiptError(parsed)) {
        return {
          error:
            parsed.error === 'not_a_receipt'
              ? 'Image is not a receipt'
              : 'Receipt unreadable',
          confidence: LOW_CONFIDENCE,
        };
      }

      const totalAmount = parseNumeric(parsed.totalAmount);
      const merchantName =
        typeof parsed.merchantName === 'string'
          ? parsed.merchantName.trim()
          : 'Unknown';

      const rawText =
        typeof parsed.rawText === 'string' ? parsed.rawText : text;

      const lineItems = parseStringArray(parsed.lineItems);
      const currency =
        typeof parsed.currency === 'string' ? parsed.currency : 'USD';

      const category = normalizeCategory(parsed.category);

      let confidence = DEFAULT_CONFIDENCE;
      if (totalAmount <= 0 || !merchantName) confidence = 0.6;
      if (lineItems.length > 0) confidence += 0.05;

      const ocr_data: OCRData = {
        merchantName,
        totalAmount,
        currency,
        category,
        lineItems,
        overallConfidence: confidence,
        rawText,
      };

      const resultObj: ExtractReceiptResult = {
        ocr_data,
        confidence,
      };

      if (typeof parsed.date === 'string') {
        resultObj.date = parsed.date;
      }

      return resultObj;
    } catch (err: any) {
      console.error('[OCRService] OCR Error:', err?.message || err);
      console.error('[OCRService] Full error:', JSON.stringify(err, null, 2));
      console.error('[OCRService] Error code:', err?.code);
      console.error('[OCRService] Error errno:', err?.errno);
      console.error('[OCRService] Error syscall:', err?.syscall);
      console.error('[OCRService] Error status:', err?.status);

      if (err?.message?.includes('API_KEY')) {
        return { error: 'Invalid API key', confidence: 0 };
      }

      const status = err?.status as number | undefined;
      if (typeof status === 'number' && status >= 400) {
        if (status === 404) {
          return {
            error: `Gemini model not found or not supported for generateContent: ${getOcrModelName()}. Set GEMINI_OCR_MODEL to a model available for your API key (see Google AI Studio / ListModels).`,
            confidence: 0,
          };
        }
        if (status === 429) {
          return { error: 'Gemini API rate limit exceeded. Try again shortly.', confidence: 0 };
        }
        return {
          error: err?.message || `Gemini API error (${status})`,
          confidence: 0,
        };
      }

      if (isLikelyNetworkFailure(err)) {
        console.error('[OCRService] Network connectivity issue:', {
          code: err?.code,
          errno: err?.errno,
          syscall: err?.syscall,
          hostname: err?.hostname,
        });
        return { error: 'Network error - cannot reach Gemini API', confidence: 0 };
      }

      return {
        error: err?.message || 'OCR failed',
        confidence: 0,
      };
    }
  }
}

export const ocrService = new OCRService();