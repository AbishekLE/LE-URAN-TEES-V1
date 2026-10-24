import { INVOICE_PREFIX, STORAGE_KEYS } from '../constants';
import type { InvoiceData, InvoiceItem } from '../types';

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode, quota). The app still works.
  }
}

export function formatInvoiceNumber(seq: number): string {
  return `${INVOICE_PREFIX}${String(seq).padStart(4, '0')}`;
}

/** Pulls the trailing digits out of an invoice number ("INV-0042" -> 42). */
export function parseSequence(invoiceNumber: string): number | null {
  const m = /(\d+)\s*$/.exec(invoiceNumber);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isSafeInteger(n) ? n : null;
}

export function getLastSequence(): number {
  const n = Number(read(STORAGE_KEYS.lastSeq));
  return Number.isSafeInteger(n) && n > 0 ? n : 0;
}

/** The number the next new invoice will get. Has no side effects. */
export function peekNextInvoiceNumber(): string {
  return formatInvoiceNumber(getLastSequence() + 1);
}

/**
 * Records that an invoice number has been used, so the counter never goes
 * backwards and the next generated number is always higher.
 */
export function registerInvoiceNumber(invoiceNumber: string): void {
  const seq = parseSequence(invoiceNumber);
  if (seq !== null && seq > getLastSequence()) {
    write(STORAGE_KEYS.lastSeq, String(seq));
  }
}

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function sanitizeItem(raw: unknown): InvoiceItem | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (!isString(r.id)) return null;
  return {
    id: r.id,
    description: isString(r.description) ? r.description : '',
    product: isString(r.product) ? r.product : '',
    color: isString(r.color) ? r.color : '',
    qty: isString(r.qty) ? r.qty : '',
    rate: isString(r.rate) ? r.rate : '',
  };
}

export function loadDraft(): InvoiceData | null {
  const raw = read(STORAGE_KEYS.draft);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const r = parsed as Record<string, unknown>;
    if (!isString(r.invoiceNumber) || !isString(r.invoiceDate) || !Array.isArray(r.items)) {
      return null;
    }
    const items = r.items.map(sanitizeItem).filter((i): i is InvoiceItem => i !== null);
    return {
      invoiceNumber: r.invoiceNumber,
      invoiceDate: r.invoiceDate,
      billTo: isString(r.billTo) ? r.billTo : '',
      phone: isString(r.phone) ? r.phone : '',
      items,
      paymentType: isString(r.paymentType) ? r.paymentType : 'Cash',
      advance: isString(r.advance) ? r.advance : '',
    };
  } catch {
    return null;
  }
}

export function saveDraft(data: InvoiceData): void {
  write(STORAGE_KEYS.draft, JSON.stringify(data));
}
