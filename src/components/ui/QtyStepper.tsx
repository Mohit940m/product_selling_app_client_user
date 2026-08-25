interface QtyStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  className?: string;
}

const QtyStepper = ({ value, min = 1, max = 99, onChange, disabled = false, className = '' }: QtyStepperProps) => {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className={`inline-flex items-center gap-3.5 rounded-full border border-line px-4 py-2 ${className}`}>
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        className="font-extrabold text-muted disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        −
      </button>
      <span className="min-w-[1ch] text-center text-sm font-extrabold text-ink" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        className="font-extrabold text-accent disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        +
      </button>
    </div>
  );
};

export default QtyStepper;
