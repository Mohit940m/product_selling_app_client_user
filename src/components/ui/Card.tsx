import type { ElementType, HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  interactive?: boolean;
  padded?: boolean;
  children: ReactNode;
}

const Card = ({ as: Tag = 'div', interactive = true, padded = false, className = '', children, ...rest }: CardProps) => {
  return (
    <Tag
      className={[
        'rounded-card border border-line bg-card overflow-hidden t-card',
        interactive ? 'lift-card hover:border-accent hover:shadow-lift-accent' : '',
        padded ? 'p-4' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Card;
