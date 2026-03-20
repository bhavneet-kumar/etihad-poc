import { SubmitClaimRequest } from '../types/claim';

/**
 * Simulates sending a confirmation email.
 */
export const sendConfirmationEmail = async (
  caseNumber: string,
  claimData: SubmitClaimRequest
): Promise<void> => {
  // Simulate delay (1-3 seconds)
  const delay = Math.floor(Math.random() * 2000) + 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const emailContent = `
    To: ${claimData.passenger.email}
    Subject: Confirmation: Your Claim ${caseNumber} has been received

    Dear ${claimData.passenger.name},

    Your claim has been submitted successfully. 
    
    Case Number: ${caseNumber}
    Total Amount: $${claimData.totalAmount.toFixed(2)} USD
    
    Summary of Expenses:
    ${claimData.expenses
      .map((exp) => `- ${exp.merchant}: $${exp.amount.toFixed(2)} (${exp.category})`)
      .join('\n')}

    Your claim has been submitted successfully. Processing time is 7–14 business days.

    Thank you for your patience.
    AeroClaims Premium Support
  `;

  console.log('--- SIMULATED EMAIL SENT ---');
  console.log(emailContent);
  console.log('-----------------------------');
};
