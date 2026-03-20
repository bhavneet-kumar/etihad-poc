import { containsKeywords } from '../utils/keywordMatcher';

const ALCOHOL_KEYWORDS = [
  "beer",
  "wine",
  "vodka",
  "whiskey",
  "rum",
  "gin",
  "champagne",
  "alcohol",
  "cocktail",
  "liquor",
  "spirits",
  "tequila",
  "brandy",
  "cognac",
  "prosecco",
  "cider",
  "ale",
  "lager",
  "stout",
  "pilsner",
  "merlot",
  "chardonnay",
  "cabernet",
  "sauvignon",
  "pinot",
  "rose",
  "shiraz",
  "malbec",
  "syrah",
  "zinfandel",
  "riesling",
  "moscato",
  "pinot grigio",
  "pinot noir",
  "margarita",
  "martini",
  "mojito",
  "daiquiri",
  "sangria",
  "bloody mary",
  "cosmopolitan",
  "old fashioned",
  "negroni",
  "manhattan",
  "mimosa",
  "aperol",
  "campari",
  "vermouth",
  "sake",
  "soju",
];

export class AlcoholDetectionService {
  /**
   * Detects alcohol in text and line items using keyword matching.
   */
  public detectAlcohol(rawText: string, lineItems: string[]): boolean {
    // Combine all text for comprehensive matching
    const combinedText = [rawText, ...lineItems].join(' ');
    return containsKeywords(combinedText, ALCOHOL_KEYWORDS);
  }
}

export const alcoholDetectionService = new AlcoholDetectionService();
