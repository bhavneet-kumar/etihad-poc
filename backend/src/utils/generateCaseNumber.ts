import { query } from '../config/db';

/**
 * Generates a unique case number in the format CAS-XXXXXX
 */
export const generateCaseNumber = async (): Promise<string> => {
  let isUnique = false;
  let caseNumber = '';

  while (!isUnique) {
    const random = Math.floor(100000 + Math.random() * 900000);
    caseNumber = `CAS-${random}`;

    const rows = await query('SELECT 1 FROM cases WHERE case_number = $1', [caseNumber]);
    if (rows.length === 0) {
      isUnique = true;
    }
  }

  return caseNumber;
};
