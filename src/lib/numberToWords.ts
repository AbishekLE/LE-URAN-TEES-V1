const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function belowHundred(n: number): string {
  if (n < 20) return ONES[n];
  const tens = TENS[Math.floor(n / 10)];
  const ones = ONES[n % 10];
  return ones ? `${tens} ${ones}` : tens;
}

function belowThousand(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds) parts.push(`${ONES[hundreds]} Hundred`);
  if (rest) parts.push(belowHundred(rest));
  return parts.join(' ');
}

/** Whole number -> words using the Indian system (Thousand, Lakh, Crore). */
export function integerToWords(n: number): string {
  if (n === 0) return 'Zero';
  const crore = Math.floor(n / 10_000_000);
  const lakh = Math.floor(n / 100_000) % 100;
  const thousand = Math.floor(n / 1_000) % 100;
  const rest = n % 1_000;

  const parts: string[] = [];
  if (crore) parts.push(`${integerToWords(crore)} Crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`);
  if (rest) parts.push(belowThousand(rest));
  return parts.join(' ');
}

/**
 * Amount in paise -> "Indian Rupees ... Only".
 *   150000   -> Indian Rupees One Thousand Five Hundred Only
 *   12550050 -> Indian Rupees One Lakh Twenty Five Thousand Five Hundred and Fifty Paise Only
 */
export function amountInWords(totalPaise: number): string {
  const safe = Math.max(0, Math.round(totalPaise));
  const rupees = Math.floor(safe / 100);
  const paise = safe % 100;

  if (rupees === 0 && paise === 0) return 'Indian Rupees Zero Only';
  if (paise === 0) return `Indian Rupees ${integerToWords(rupees)} Only`;
  if (rupees === 0) return `Indian Rupees ${belowHundred(paise)} Paise Only`;
  return `Indian Rupees ${integerToWords(rupees)} and ${belowHundred(paise)} Paise Only`;
}
