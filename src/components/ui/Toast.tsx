import { toast, type ToastOptions } from 'react-toastify';

interface ToastProps {
  title: string;
  sub?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** The dark inline toast from the Kartly design-system panel. */
const Toast = ({ title, sub, actionLabel, onAction }: ToastProps) => {
  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-ink px-4 py-4 text-card">
      <span className="h-6 w-6 shrink-0 rounded-full bg-accent" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-extrabold">{title}</p>
        {sub && <p className="mt-0.5 truncate text-[11px] font-medium opacity-70">{sub}</p>}
      </div>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 text-[11px] font-extrabold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default Toast;

/** Fires a Kartly-styled toast through the app's shared react-toastify instance. */
export const showKartlyToast = (
  props: ToastProps,
  options?: ToastOptions,
): ReturnType<typeof toast> => {
  return toast(<Toast {...props} />, {
    className: '!bg-transparent !shadow-none !p-0',
    ...options,
  });
};

export type { ToastProps };
