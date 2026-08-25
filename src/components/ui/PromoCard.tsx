import type { ReactNode } from 'react';

interface PromoCardProps {
  eyebrow: string;
  children: ReactNode;
  className?: string;
}

const PromoCard = ({ eyebrow, children, className = '' }: PromoCardProps) => {
  return (
    <div className={`rounded-card bg-soft p-4 text-[var(--k-on-soft)] ${className}`}>
      <span className="mb-1.5 block font-mono text-[10px] font-bold text-[var(--k-on-soft-muted)]">{eyebrow}</span>
      {children}
    </div>
  );
};

export default PromoCard;
