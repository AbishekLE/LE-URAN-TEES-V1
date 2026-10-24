import { COLORS, COLOR_NAMES, PRODUCTS } from '../constants';
import { formatPaise } from '../lib/currency';
import { amountInWords } from '../lib/numberToWords';
import type { InvoiceErrors, InvoiceItem, Totals } from '../types';
import { FieldError, NumberField } from './fields';

interface Props {
  items: InvoiceItem[];
  totals: Totals;
  errors: InvoiceErrors;
  onChange: (id: string, patch: Partial<InvoiceItem>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export function ItemsTable({ items, totals, errors, onChange, onAdd, onRemove }: Props) {
  return (
    <section className="card" aria-labelledby="items-title">
      <h2 id="items-title" className="card-title">
        Items
      </h2>

      <div className="table-scroll">
        <table className="items-table">
          <thead>
            <tr>
              <th className="col-sno">S.No</th>
              <th className="col-desc">Item &amp; Description</th>
              <th className="col-product">Product Name</th>
              <th className="col-color">Color</th>
              <th className="col-qty">Qty</th>
              <th className="col-rate">Amount / Qty</th>
              <th className="col-total">Total Amount</th>
              <th className="col-action">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const e = errors.items[item.id] ?? {};
              const n = index + 1;
              const swatch = COLORS[item.color];
              return (
                <tr key={item.id}>
                  <td data-label="S.No" className="cell-sno">
                    <span className="sno">{n}</span>
                  </td>
                  <td data-label="Item & Description" className="cell-desc">
                    <input
                      className="input"
                      type="text"
                      value={item.description}
                      placeholder="e.g. Custom Logo Print"
                      aria-label={`Item ${n} description`}
                      onChange={(ev) => onChange(item.id, { description: ev.target.value })}
                    />
                  </td>
                  <td data-label="Product Name">
                    <select
                      className="input"
                      value={item.product}
                      aria-label={`Item ${n} product`}
                      aria-invalid={e.product ? true : undefined}
                      onChange={(ev) => onChange(item.id, { product: ev.target.value })}
                    >
                      <option value="">Select Product</option>
                      {PRODUCTS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <FieldError message={e.product} />
                  </td>
                  <td data-label="Color">
                    <div className="color-select">
                      <span
                        className={`swatch${swatch ? '' : ' empty'}`}
                        style={swatch ? { background: swatch } : undefined}
                        aria-hidden="true"
                      />
                      <select
                        className="input"
                        value={item.color}
                        aria-label={`Item ${n} color`}
                        aria-invalid={e.color ? true : undefined}
                        onChange={(ev) => onChange(item.id, { color: ev.target.value })}
                      >
                        <option value="">Select Color</option>
                        {COLOR_NAMES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <FieldError message={e.color} />
                  </td>
                  <td data-label="Qty">
                    <NumberField
                      value={item.qty}
                      onChange={(v) => onChange(item.id, { qty: v })}
                      ariaLabel={`Item ${n} quantity`}
                      invalid={!!e.qty}
                      placeholder="0"
                    />
                    <FieldError message={e.qty} />
                  </td>
                  <td data-label="Amount / Qty">
                    <NumberField
                      value={item.rate}
                      onChange={(v) => onChange(item.id, { rate: v })}
                      ariaLabel={`Item ${n} amount per quantity`}
                      invalid={!!e.rate}
                      placeholder="0.00"
                      prefix="₹"
                    />
                    <FieldError message={e.rate} />
                  </td>
                  <td data-label="Total Amount" className="cell-total">
                    <output className="calc" aria-label={`Item ${n} total`}>
                      {formatPaise(totals.lineTotals[item.id] ?? 0)}
                    </output>
                  </td>
                  <td className="cell-action">
                    <button
                      type="button"
                      className="btn btn-icon"
                      onClick={() => onRemove(item.id)}
                      disabled={items.length === 1}
                      aria-label={`Remove item ${n}`}
                      title={items.length === 1 ? 'At least one item is required' : 'Remove item'}
                    >
                      <span aria-hidden="true">✕</span>
                      <span className="btn-icon-text">Remove</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="items-footer">
        <button type="button" className="btn btn-secondary" onClick={onAdd}>
          + Add Item
        </button>
      </div>

      <div className="grand">
        <div className="grand-row">
          <span className="grand-label">Grand Total</span>
          <output className="grand-amount" aria-live="polite">
            {formatPaise(totals.grand)}
          </output>
        </div>
        <p className="grand-words">{amountInWords(totals.grand)}</p>
      </div>
    </section>
  );
}
