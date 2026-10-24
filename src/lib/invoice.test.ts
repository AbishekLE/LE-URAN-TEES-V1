import { describe, expect, it } from 'vitest';
import { formatPaise } from './currency';
import {
  computeTotals,
  createBlankInvoice,
  createBlankItem,
  isValidPhone,
  validateInvoice,
} from './invoice';

function sampleInvoice() {
  const inv = createBlankInvoice('INV-0001');
  inv.items = [
    { ...createBlankItem(), id: 'a', qty: '3', rate: '500', product: 'Shirt', color: 'Red' },
    { ...createBlankItem(), id: 'b', qty: '2', rate: '500', product: 'Acid Wash', color: 'Black' },
    { ...createBlankItem(), id: 'c', qty: '1.5', rate: '500', product: 'Shirt', color: 'Lime' },
  ];
  return inv;
}

describe('computeTotals', () => {
  it('sums line totals into the Grand Total', () => {
    expect(computeTotals(sampleInvoice()).grand).toBe(325000); // ₹3,250.00
  });

  it('derives pending amount and payment status', () => {
    const inv = sampleInvoice();
    expect(computeTotals(inv).status).toBe('Pending');

    inv.advance = '2000';
    const partial = computeTotals(inv);
    expect(partial.pending).toBe(125000);
    expect(partial.status).toBe('Partially Paid');

    inv.advance = '3250';
    const paid = computeTotals(inv);
    expect(paid.pending).toBe(0);
    expect(paid.status).toBe('Paid');
  });

  it('never lets pending go negative', () => {
    const inv = sampleInvoice();
    inv.advance = '9999';
    expect(computeTotals(inv).pending).toBe(0);
  });
});

describe('validateInvoice', () => {
  it('flags an advance above the Grand Total', () => {
    const inv = sampleInvoice();
    inv.advance = '5000';
    expect(validateInvoice(inv, false).advance).toContain('Grand Total');
  });

  it('flags negative numbers', () => {
    const inv = sampleInvoice();
    inv.items[0].qty = '-1';
    inv.items[1].rate = '-5';
    const errors = validateInvoice(inv, false);
    expect(errors.items.a.qty).toContain('negative');
    expect(errors.items.b.rate).toContain('negative');
  });

  it('requires product, color, qty and amount only in strict mode', () => {
    const inv = createBlankInvoice('INV-0001');
    expect(validateInvoice(inv, false).count).toBe(0);
    expect(validateInvoice(inv, true).count).toBe(4);
  });

  it('requires an invoice number', () => {
    expect(validateInvoice(createBlankInvoice(''), false).invoiceNumber).toBeTruthy();
  });
});

describe('formatPaise', () => {
  it('uses Indian digit grouping', () => {
    expect(formatPaise(12550050)).toBe('₹1,25,500.50');
    expect(formatPaise(325000)).toBe('₹3,250.00');
  });
});

describe('phone number', () => {
  it('is optional and accepts common formats', () => {
    expect(isValidPhone('98765 43210')).toBe(true);
    expect(isValidPhone('+91 98765-43210')).toBe(true);
    expect(validateInvoice(createBlankInvoice('INV-0001'), false).phone).toBeUndefined();
  });

  it('rejects letters and too-short numbers', () => {
    expect(isValidPhone('abc12345')).toBe(false);
    expect(isValidPhone('12345')).toBe(false);
    const inv = createBlankInvoice('INV-0001');
    inv.phone = '12ab';
    expect(validateInvoice(inv, false).phone).toBeTruthy();
  });
});
