export interface InvoiceItem {
  id: string;
  description: string;
  product: string;
  color: string;
  /** Kept as strings so the user can type freely (empty, "1.", etc.). */
  qty: string;
  rate: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  /** ISO date, YYYY-MM-DD (the value format of <input type="date">). */
  invoiceDate: string;
  billTo: string;
  /** Customer phone number (optional). */
  phone: string;
  items: InvoiceItem[];
  paymentType: string;
  advance: string;
}

export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Pending';

/** All money values below are integers in paise to avoid floating point drift. */
export interface Totals {
  lineTotals: Record<string, number>;
  grand: number;
  advance: number;
  pending: number;
  status: PaymentStatus;
}

export interface ItemErrors {
  product?: string;
  color?: string;
  qty?: string;
  rate?: string;
}

export interface InvoiceErrors {
  invoiceNumber?: string;
  invoiceDate?: string;
  phone?: string;
  advance?: string;
  items: Record<string, ItemErrors>;
  /** Total number of problems found. */
  count: number;
}
