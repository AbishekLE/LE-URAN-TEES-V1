import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActionBar } from './components/ActionBar';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Header } from './components/Header';
import { InvoiceDetails } from './components/InvoiceDetails';
import { ItemsTable } from './components/ItemsTable';
import { PaymentSection } from './components/PaymentSection';
import { PreviewModal } from './components/PreviewModal';
import {
  computeTotals,
  createBlankInvoice,
  createBlankItem,
  hasEnteredData,
  validateInvoice,
} from './lib/invoice';
import {
  loadDraft,
  peekNextInvoiceNumber,
  registerInvoiceNumber,
  saveDraft,
} from './lib/storage';
import type { InvoiceData, InvoiceItem } from './types';

type Notice = { kind: 'success' | 'error'; text: string } | null;

function initialInvoice(): InvoiceData {
  const draft = loadDraft();
  if (draft) {
    return draft.items.length > 0 ? draft : { ...draft, items: [createBlankItem()] };
  }
  return createBlankInvoice(peekNextInvoiceNumber());
}

export default function App() {
  const [data, setData] = useState<InvoiceData>(initialInvoice);
  const [attempted, setAttempted] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Make sure the running counter knows about the number that is on screen.
  useEffect(() => {
    registerInvoiceNumber(data.invoiceNumber);
  }, []); // run once on load

  // Keep the work-in-progress invoice safe across refreshes.
  useEffect(() => {
    saveDraft(data);
  }, [data]);

  const totals = useMemo(() => computeTotals(data), [data]);
  const errors = useMemo(() => validateInvoice(data, attempted), [data, attempted]);

  const patch = useCallback((p: Partial<InvoiceData>) => {
    setData((d) => ({ ...d, ...p }));
    setNotice(null);
  }, []);

  const patchItem = useCallback((id: string, p: Partial<InvoiceItem>) => {
    setData((d) => ({
      ...d,
      items: d.items.map((i) => (i.id === id ? { ...i, ...p } : i)),
    }));
    setNotice(null);
  }, []);

  const addItem = useCallback(() => {
    setData((d) => ({ ...d, items: [...d.items, createBlankItem()] }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setData((d) =>
      d.items.length <= 1 ? d : { ...d, items: d.items.filter((i) => i.id !== id) },
    );
  }, []);

  const resetInvoice = useCallback(() => {
    registerInvoiceNumber(data.invoiceNumber);
    const next = peekNextInvoiceNumber();
    registerInvoiceNumber(next);
    setData(createBlankInvoice(next));
    setAttempted(false);
    setNotice(null);
    setConfirmReset(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [data.invoiceNumber]);

  const requestNewInvoice = () => {
    if (hasEnteredData(data)) setConfirmReset(true);
    else resetInvoice();
  };

  /** Returns true when the invoice is fine to export; otherwise shows the problems. */
  const checkBeforeExport = (): boolean => {
    const strict = validateInvoice(data, true);
    if (strict.count === 0) return true;
    setAttempted(true);
    setNotice({
      kind: 'error',
      text: `Please fix ${strict.count} highlighted ${strict.count === 1 ? 'field' : 'fields'} before exporting.`,
    });
    window.setTimeout(() => {
      const first = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      first?.focus({ preventScroll: true });
    }, 50);
    return false;
  };

  const handleExport = async () => {
    if (!checkBeforeExport()) return;
    setBusy(true);
    try {
      registerInvoiceNumber(data.invoiceNumber);
      const { exportInvoicePdf } = await import('./lib/pdfExport');
      await exportInvoicePdf(data);
      setNotice({ kind: 'success', text: 'Invoice PDF created. Check your downloads.' });
    } catch (err) {
      console.error(err);
      setNotice({ kind: 'error', text: 'Could not create the PDF. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const handlePreview = async () => {
    if (!checkBeforeExport()) return;
    setBusy(true);
    try {
      const { previewInvoicePdf } = await import('./lib/pdfExport');
      const url = await previewInvoicePdf(data);
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
    } catch (err) {
      console.error(err);
      setNotice({ kind: 'error', text: 'Could not create the preview. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const closePreview = useCallback(() => {
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  }, []);

  const cancelReset = useCallback(() => setConfirmReset(false), []);

  return (
    <>
      <Header />
      <main className="app">
        <div className="toolbar">
          <div>
            <h2 className="page-title">Invoice Editor</h2>
            <p className="hint">Your work is saved in this browser automatically.</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={requestNewInvoice}>
            New Invoice
          </button>
        </div>

        <InvoiceDetails
          data={data}
          errors={errors}
          onChange={patch}
          onNumberBlur={() => registerInvoiceNumber(data.invoiceNumber)}
        />
        <ItemsTable
          items={data.items}
          totals={totals}
          errors={errors}
          onChange={patchItem}
          onAdd={addItem}
          onRemove={removeItem}
        />
        <PaymentSection data={data} totals={totals} errors={errors} onChange={patch} />

        {notice && (
          <div className={`notice notice-${notice.kind}`} role="status">
            {notice.text}
          </div>
        )}
        <ActionBar busy={busy} onExport={handleExport} onPreview={handlePreview} />
      </main>

      {confirmReset && (
        <ConfirmDialog
          title="Start a new invoice?"
          message="This clears the customer details, items and payment details you have entered. The shop details stay the same."
          confirmLabel="Clear and start new"
          onConfirm={resetInvoice}
          onCancel={cancelReset}
        />
      )}
      {previewUrl && (
        <PreviewModal url={previewUrl} onClose={closePreview} onDownload={handleExport} busy={busy} />
      )}
    </>
  );
}
