const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats an amount held in paise as Indian Rupees, e.g. 12550050 -> "₹1,25,500.50". */
export function formatPaise(paise: number): string {
  return inr.format(paise / 100);
}

/** Converts a rupee value (possibly with decimals) to integer paise. */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}
