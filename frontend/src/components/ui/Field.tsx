import { forwardRef, type InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Field = forwardRef<HTMLInputElement, Props>(function Field({ label, error, id, ...rest }, ref) {
  const inputId = id ?? rest.name;
  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 aria-invalid:border-red-400"
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
});
