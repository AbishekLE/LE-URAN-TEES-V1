import { COLOR_NAMES, PAYMENT_TYPES, PRODUCTS } from '../constants';
import type {
  InvoiceData,
  InvoiceErrors,
  InvoiceItem,
  ItemErrors,
  PaymentStatus,
  Totals,
} from '../types';
import { formatPaise, rupeesToPaise } from './currency';

let idCounter = 0;
export function newId(): string {
  idCounter += 1;
  return `item-${Date.now().toString(36)}-${idCounter}`;
}

export function createBlankItem(): InvoiceItem {
  return { id: newId(), description: '', product: '', color: '', qty: '', rate: '' };
}

/** Today's date in the user's local time zone as YYYY-MM-DD. */
export function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** YYYY-MM-DD -> DD/MM/YYYY (returns the input unchanged if it is not an ISO date). */
export function formatDateDMY(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export function createBlankInvoice(invoiceNumber: string): InvoiceData {
  return {
    invoiceNumber,
    invoiceDate: todayISO(),
    billTo: '',
    phone: '',
    items: [createBlankItem()],
    paymentType: PAYMENT_TYPES[0],
    advance: '',
  };
}

/** Optional field: digits with an optional leading +, spaces, dashes or brackets; 7-15 digits. */
export function isValidPhone(value: string): boolean {
  const v = value.trim();
  if (!/^[0-9+\-()\s]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, '').length;
  return digits >= 7 && digits <= 15;
}

/** Parses a user-entered number; empty or invalid input becomes NaN. */
export function parseAmount(value: string): number {
  if (value.trim() === '') return NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function numOrZero(value: string): number {
  const n = parseAmount(value);
  return Number.isNaN(n) ? 0 : n;
}

export function lineTotalPaise(item: InvoiceItem): number {
  const qty = numOrZero(item.qty);
  const rate = numOrZero(item.rate);
  if (qty < 0 || rate < 0) return 0;
  return rupeesToPaise(qty * rate);
}

export function paymentStatus(grand: number, advance: number): PaymentStatus {
  if (advance <= 0) return 'Pending';
  if (advance >= grand) return 'Paid';
  return 'Partially Paid';
}

export function computeTotals(data: InvoiceData): Totals {
  const lineTotals: Record<string, number> = {};
  let grand = 0;
  for (const item of data.items) {
    const total = lineTotalPaise(item);
    lineTotals[item.id] = total;
    grand += total;
  }
  const rawAdvance = numOrZero(data.advance);
  const advance = rawAdvance > 0 ? rupeesToPaise(rawAdvance) : 0;
  const pending = Math.max(grand - advance, 0);
  return { lineTotals, grand, advance, pending, status: paymentStatus(grand, advance) };
}

/**
 * Validates an invoice.
 * - strict = false: only problems that are wrong as soon as they are typed
 *   (negative numbers, advance above the Grand Total, blank number/date).
 * - strict = true: also the "required" checks used when exporting the PDF.
 */
export function validateInvoice(data: InvoiceData, strict: boolean): InvoiceErrors {
  const errors: InvoiceErrors = { items: {}, count: 0 };
  const add = () => {
    errors.count += 1;
  };

  if (data.invoiceNumber.trim() === '') {
    errors.invoiceNumber = 'Invoice number is required.';
    add();
  }
  if (data.invoiceDate.trim() === '') {
    errors.invoiceDate = 'Invoice date is required.';
    add();
  }

  if (data.phone.trim() !== '' && !isValidPhone(data.phone)) {
    errors.phone = 'Enter a valid phone number (7 to 15 digits).';
    add();
  }

  for (const item of data.items) {
    const e: ItemErrors = {};

    const qty = parseAmount(item.qty);
    if (!Number.isNaN(qty) && qty < 0) e.qty = 'Qty cannot be negative.';
    else if (!Number.isNaN(qty) && qty === 0) e.qty = 'Qty must be more than 0.';
    else if (strict && Number.isNaN(qty)) e.qty = 'Enter a quantity.';

    const rate = parseAmount(item.rate);
    if (!Number.isNaN(rate) && rate < 0) e.rate = 'Amount cannot be negative.';
    else if (strict && Number.isNaN(rate)) e.rate = 'Enter the amount per qty.';

    if (item.product !== '' && !(PRODUCTS as readonly string[]).includes(item.product)) {
      e.product = 'Choose a product from the list.';
    } else if (strict && item.product === '') {
      e.product = 'Select a product.';
    }

    if (item.color !== '' && !COLOR_NAMES.includes(item.color)) {
      e.color = 'Choose a color from the list.';
    } else if (strict && item.color === '') {
      e.color = 'Select a color.';
    }

    const found = Object.keys(e).length;
    if (found > 0) {
      errors.items[item.id] = e;
      errors.count += found;
    }
  }

  const advanceRaw = parseAmount(data.advance);
  if (!Number.isNaN(advanceRaw)) {
    const { grand } = computeTotals(data);
    if (advanceRaw < 0) {
      errors.advance = 'Advance amount cannot be negative.';
      add();
    } else if (rupeesToPaise(advanceRaw) > grand) {
      errors.advance = `Advance cannot be more than the Grand Total (${formatPaise(grand)}).`;
      add();
    }
  }

  return errors;
}

/** True when the user has typed anything worth protecting from an accidental reset. */
export function hasEnteredData(data: InvoiceData): boolean {
  if (data.billTo.trim() !== '' || data.phone.trim() !== '' || data.advance.trim() !== '') {
    return true;
  }
  return data.items.some(
    (i) =>
      i.description.trim() !== '' ||
      i.product !== '' ||
      i.color !== '' ||
      i.qty.trim() !== '' ||
      i.rate.trim() !== '',
  );
}

/** Safe file name, e.g. LE_URBAN_TEES_INV-0001.pdf */
export function pdfFileName(invoiceNumber: string): string {
  const safe = invoiceNumber.trim().replace(/[^A-Za-z0-9_-]+/g, '_') || 'INVOICE';
  return `LE_URBAN_TEES_${safe}.pdf`;
}
