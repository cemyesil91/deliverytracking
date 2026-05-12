import { useState, useEffect } from 'react';
import type { DateRange } from '../types/index';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  onSubmit?: (range: DateRange) => void;
  submitLabel?: string;
  disabled?: boolean;
}

/**
 * Date range input with client-side validation (start ≤ end).
 * Displays an inline error when start > end.
 * Requirements: 7.2, 9.4
 */
export function DateRangePicker({
  value,
  onChange,
  onSubmit,
  submitLabel = 'Apply',
  disabled = false,
}: DateRangePickerProps) {
  const [error, setError] = useState<string | null>(null);

  // Validate whenever dates change
  useEffect(() => {
    if (value.startDate && value.endDate && value.startDate > value.endDate) {
      setError('Start date must not be after end date.');
    } else {
      setError(null);
    }
  }, [value.startDate, value.endDate]);

  function handleSubmit() {
    if (!onSubmit) return;
    if (error) return;
    if (!value.startDate || !value.endDate) {
      setError('Both start and end dates are required.');
      return;
    }
    onSubmit(value);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            From
          </label>
          <input
            type="date"
            value={value.startDate}
            max={value.endDate || undefined}
            onChange={(e) => onChange({ ...value, startDate: e.target.value })}
            disabled={disabled}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            To
          </label>
          <input
            type="date"
            value={value.endDate}
            min={value.startDate || undefined}
            onChange={(e) => onChange({ ...value, endDate: e.target.value })}
            disabled={disabled}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {onSubmit && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || !!error || !value.startDate || !value.endDate}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white
                       hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                       focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            {submitLabel}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-600 flex items-center gap-1">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}
