import { useEffect, useState } from 'react';

type ToastVariant = 'success' | 'error';

interface ConfirmationToastProps {
  message: string;
  variant: ToastVariant;
  /** Auto-dismiss after this many ms. Set to 0 to disable. Default: 4000 */
  duration?: number;
  onDismiss?: () => void;
}

/**
 * Success/error notification toast.
 * Auto-dismisses after `duration` ms (default 4 s).
 * Requirements: 6.3
 */
export function ConfirmationToast({
  message,
  variant,
  duration = 4000,
  onDismiss,
}: ConfirmationToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  if (!visible) return null;

  const isSuccess = variant === 'success';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-50 flex items-start gap-3 rounded-lg border px-4 py-3
                  shadow-lg max-w-sm text-sm transition-all
                  ${
                    isSuccess
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
    >
      {/* Icon */}
      <span className="mt-0.5 shrink-0 text-base" aria-hidden="true">
        {isSuccess ? '✓' : '✕'}
      </span>

      <p className="flex-1">{message}</p>

      <button
        type="button"
        onClick={() => {
          setVisible(false);
          onDismiss?.();
        }}
        aria-label="Dismiss notification"
        className={`shrink-0 rounded p-0.5 hover:bg-black/10 focus:outline-none focus:ring-2
                    ${isSuccess ? 'focus:ring-green-500' : 'focus:ring-red-500'}`}
      >
        <span aria-hidden="true" className="text-xs">✕</span>
      </button>
    </div>
  );
}

/**
 * Hook to manage toast state conveniently.
 *
 * Usage:
 *   const { toast, showToast, clearToast } = useToast();
 *   showToast('Saved!', 'success');
 *   return toast ? <ConfirmationToast {...toast} onDismiss={clearToast} /> : null;
 */
export function useToast() {
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  function showToast(message: string, variant: ToastVariant) {
    setToast({ message, variant });
  }

  function clearToast() {
    setToast(null);
  }

  return { toast, showToast, clearToast };
}
