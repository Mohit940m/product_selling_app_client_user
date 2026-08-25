import type { ElementType, ReactNode } from 'react';

type ContainerProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
};

/**
 * The single page-width container used across the app. Replaces the
 * ad-hoc `mx-auto max-w-7xl px-4 sm:px-6` repeated on every page.
 */
const Container = ({ children, as: Tag = 'div', className = '' }: ContainerProps) => {
  return <Tag className={`mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-10 ${className}`}>{children}</Tag>;
};

export default Container;
