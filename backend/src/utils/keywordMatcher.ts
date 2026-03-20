/**
 * Utility for case-insensitive partial keyword matching.
 */
export const containsKeywords = (text: string, keywords: string[]): boolean => {
  const normalizedText = text.toLowerCase();
  return keywords.some((keyword) => normalizedText.includes(keyword.toLowerCase()));
};
