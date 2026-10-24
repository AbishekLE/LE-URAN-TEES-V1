interface Props {
  busy: boolean;
  onExport: () => void;
  onPreview: () => void;
}

export function ActionBar({ busy, onExport, onPreview }: Props) {
  return (
    <div className="action-bar">
      <button type="button" className="btn btn-secondary btn-lg" onClick={onPreview} disabled={busy}>
        Preview Invoice
      </button>
      <button type="button" className="btn btn-primary btn-xl" onClick={onExport} disabled={busy}>
        {busy ? 'Preparing PDF…' : 'Export Invoice as PDF'}
      </button>
    </div>
  );
}
