import { PAYMENT_TYPES } from '../constants';
import { formatPaise } from '../lib/currency';
import type { InvoiceData, InvoiceErrors, PaymentStatus, Totals } from '../types';
import { FieldError, NumberField } from './fields';

interface Props {
  data: InvoiceData;
  totals: Totals;
  errors: InvoiceErrors;
  onChange: (patch: Partial<InvoiceData>) => void;
}

const STATUS_CLASS: Record<PaymentStatus, string> = {
  Paid: 'status-paid',
  'Partially Paid': 'status-partial',
  Pending: 'status-pending',
};

export function PaymentSection({ data, totals, errors, onChange }: Props) {
  return (
    <section className="card" aria-labelledby="payment-title">
      <h2 id="payment-title" className="card-title">
        Payment Details
      </h2>
      <div className="payment-grid">
        <div className="field">
          <label htmlFor="payment-type">Payment Type</label>
          <select
            id="payment-type"
            className="input"
            value={data.paymentType}
            onChange={(e) => onChange({ paymentType: e.target.value })}
          >
            {PAYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="advance">Advance Amount</label>
          <NumberField
            id="advance"
            value={data.advance}
            onChange={(v) => onChange({ advance: v })}
            ariaLabel="Advance amount"
            invalid={!!errors.advance}
            placeholder="0.00"
            prefix="₹"
          />
          <FieldError message={errors.advance} />
        </div>

        <div className="field">
          <span className="label">Pending Amount</span>
          <output className="calc calc-box">{formatPaise(totals.pending)}</output>
          <p className="hint">Calculated automatically.</p>
        </div>

        <div className="field">
          <span className="label">Payment Status</span>
          <output className={`status-badge ${STATUS_CLASS[totals.status]}`} aria-live="polite">
            <span className="status-dot" aria-hidden="true" />
            {totals.status}
          </output>
          <p className="hint">Calculated automatically.</p>
        </div>
      </div>
    </section>
  );
}
