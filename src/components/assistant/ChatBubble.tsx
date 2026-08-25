import type { ReactNode } from 'react';

interface ChatBubbleProps {
  from: 'user' | 'assistant';
  children: ReactNode;
  delay?: number;
}

const ChatBubble = ({ from, children, delay = 0 }: ChatBubbleProps) => {
  const isUser = from === 'user';
  return (
    <div
      className={[
        'animate-up text-[12.5px] font-medium',
        isUser
          ? 'self-end max-w-[78%] rounded-[18px_18px_5px_18px] bg-ink px-3.75 py-3 text-card'
          : 'max-w-[88%] rounded-[18px_18px_18px_5px] border border-line bg-soft2 px-3.75 py-3 text-ink',
      ].join(' ')}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default ChatBubble;
