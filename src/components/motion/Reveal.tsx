import type { ElementType, ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
};

/**
 * Applies the prototype's `animate-up` entrance with a staggered delay.
 * Default ladder mirrors the success-screen copy stagger (250 / 400 / 550 / 700ms)
 * from Kartly Commerce Kit.dc.html — pass `delay` in ms to place items on that ladder.
 */
const Reveal = ({ children, delay = 0, as: Tag = 'div', className = '' }: RevealProps) => {
  return (
    <Tag className={`animate-up ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
};

export default Reveal;
