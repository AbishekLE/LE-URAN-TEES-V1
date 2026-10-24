import { useEffect } from 'react';

interface Props {
  url: string;
  onClose: () => void;
  onDownload: () => void;
  busy: boolean;
}

export function PreviewModal({ url, onClose, onDownload, busy }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="preview"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="preview-bar">
          <h2 id="preview-title">Invoice Preview (A4)</h2>
          <div className="preview-actions">
            <a className="btn btn-secondary" href={url} target="_blank" rel="noreferrer">
              Open in new tab
            </a>
            <button type="button" className="btn btn-primary" onClick={onDownload} disabled={busy}>
              Download PDF
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <iframe className="preview-frame" title="Invoice PDF preview" src={url} />
        <p className="hint preview-note">
          If the preview is blank on your phone, use “Open in new tab” or “Download PDF”.
        </p>
      </div>
    </div>
  );
}
