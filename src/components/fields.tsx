import type { KeyboardEvent } from 'react';

interface NumberFieldProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  invalid?: boolean;
  placeholder?: string;
  prefix?: string;
  id?: string;
}

// Keep exponent / plus characters out of the number inputs.
function blockExponent(e: KeyboardEvent<HTMLInputElement>) {
  if (e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault();
}

export function NumberField({
  value,
  onChange,
  ariaLabel,
  invalid,
  placeholder,
  prefix,
  id,
}: NumberFieldProps) {
  return (
    <div className={`input-wrap${prefix ? ' has-prefix' : ''}`}>
      {prefix && (
        <span className="prefix" aria-hidden="true">
          {prefix}
        </span>
      )}
      <input
        id={id}
        className="input"
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
        onWheel={(e) => e.currentTarget.blur()}
        onKeyDown={blockExponent}
      />
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="field-error" role="alert">
      {message}
    </p>
  );
}
