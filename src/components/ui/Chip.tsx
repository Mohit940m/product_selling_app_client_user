import type { ButtonHTMLAttributes } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

const Chip = ({ selected = false, className = '', type = 'button', children, ...rest }: ChipProps) => {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={[
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2.5 text-xs font-bold t-fast',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        selected
          ? 'border-transparent bg-accent text-onacc'
          : 'border-line text-ink hover:border-accent hover:text-accent',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Chip;
