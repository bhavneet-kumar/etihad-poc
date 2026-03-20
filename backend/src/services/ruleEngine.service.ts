import { PolicyRule, Claim, Expense, RuleEvaluationResult, DisruptionPeriod } from '../types/claim';
import { isWithinInterval, parseISO } from 'date-fns';
import { alcoholDetectionService } from './alcoholDetection.service';

export class RuleEngineService {
  /**
   * Evaluates a claim and its expenses against a set of policy rules.
   */
  public evaluateRules(
    claim: Partial<Claim>,
    expenses: Partial<Expense>[],
    rules: PolicyRule[],
    disruptionPeriod: DisruptionPeriod
  ): RuleEvaluationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Pre-process expenses for alcohol detection and low confidence
    for (const exp of expenses) {
      if (exp.ocr_data) {
        // Alcohol Detection
        const isAlcohol = alcoholDetectionService.detectAlcohol(
          exp.ocr_data.rawText,
          exp.ocr_data.lineItems
        );
        if (isAlcohol) {
          exp.is_alcohol = true;
          // ALCOHOL_BLOCK (NEW - critical) - Fail Fast
          return {
            errors: ["Etihad Airways policy does not permit alcohol-related expenses"],
            warnings: [],
          };
        }

        // Low OCR Confidence Warning
        if (exp.ocr_data.overallConfidence < 0.85) {
          warnings.push(`Low OCR confidence for expense from ${exp.merchant}. Manual review recommended.`);
        }
      }
    }

    const interval = {
      start: parseISO(disruptionPeriod.startDate),
      end: parseISO(disruptionPeriod.endDate),
    };

    for (const rule of rules) {
      if (!rule.active) continue;

      let result: { isValid: boolean; message: string } | null = null;

      switch (rule.rule_type) {
        case 'MAX_LIMIT':
          result = this.handleMaxLimit(claim, rule);
          break;
        case 'DATE_RANGE':
          result = this.handleDateRange(expenses, interval, rule);
          break;
        case 'ENTERTAINMENT_BLOCK':
          result = this.handleEntertainmentBlock(expenses, rule);
          break;
        case 'PHONE_LIMIT':
          result = this.handlePhoneLimit(expenses, rule);
          break;
        case 'ITEMIZED_REQUIRED':
          result = this.handleItemizedRequired(expenses, rule);
          break;
        case 'TRANSPORT_DATE_VALIDATION':
          result = this.handleTransportDateValidation(expenses, interval, rule);
          break;
        default:
          console.warn(`Unknown rule type: ${rule.rule_type}`);
          continue;
      }

      if (result && !result.isValid) {
        if (rule.severity === 'ERROR') {
          errors.push(result.message);
        } else {
          warnings.push(result.message);
        }
      }
    }

    return { errors, warnings };
  }

  private handleMaxLimit(claim: Partial<Claim>, rule: PolicyRule) {
    const limit = rule.value_numeric || 6303;
    const total = claim.total_amount || 0;
    
    return {
      isValid: total <= limit,
      message: rule.error_message.replace('{limit}', limit.toString()),
    };
  }

  private handleDateRange(expenses: Partial<Expense>[], interval: { start: Date; end: Date }, rule: PolicyRule) {
    const invalidExpenses = expenses.filter(exp => {
      if (!exp.date) return true;
      const date = parseISO(exp.date);
      return !isWithinInterval(date, interval);
    });

    return {
      isValid: invalidExpenses.length === 0,
      message: rule.error_message,
    };
  }

  private handleEntertainmentBlock(expenses: Partial<Expense>[], rule: PolicyRule) {
    const entertainmentExpenses = expenses.filter(exp => exp.is_entertainment === true);
    return {
      isValid: entertainmentExpenses.length === 0,
      message: rule.error_message,
    };
  }

  private handlePhoneLimit(expenses: Partial<Expense>[], rule: PolicyRule) {
    const limit = rule.value_numeric || 2;
    const phoneExpenses = expenses.filter(exp => exp.category === 'communication');
    
    return {
      isValid: phoneExpenses.length <= limit,
      message: rule.error_message.replace('{limit}', limit.toString()),
    };
  }

  private handleItemizedRequired(expenses: Partial<Expense>[], rule: PolicyRule) {
    const missingLineItems = expenses.filter(exp => {
      return !exp.line_items || (Array.isArray(exp.line_items) && exp.line_items.length === 0);
    });

    return {
      isValid: missingLineItems.length === 0,
      message: rule.error_message,
    };
  }

  private handleTransportDateValidation(expenses: Partial<Expense>[], interval: { start: Date; end: Date }, rule: PolicyRule) {
    const transportExpenses = expenses.filter(exp => exp.category === 'transport');
    const invalidTransport = transportExpenses.filter(exp => {
      if (!exp.date) return true;
      const date = parseISO(exp.date);
      return !isWithinInterval(date, interval);
    });

    return {
      isValid: invalidTransport.length === 0,
      message: rule.error_message,
    };
  }
}

export const ruleEngineService = new RuleEngineService();
