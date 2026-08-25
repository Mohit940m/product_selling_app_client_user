import { useState } from 'react';
import { FiArrowUp } from 'react-icons/fi';
import Container from '../components/layout/Container';
import Chip from '../components/ui/Chip';
import EmptyState from '../components/ui/EmptyState';
import ChatBubble from '../components/assistant/ChatBubble';
import TypingDots from '../components/assistant/TypingDots';

const ASSISTANT_ENABLED = import.meta.env.VITE_ENABLE_ASSISTANT === 'true';

const PICKS = [
  { name: 'Fine Chain Pendant', note: '14k plated · ships Fri', price: '₹4,500' },
  { name: 'Hoop Earrings', note: 'Sterling silver', price: '₹3,250' },
  { name: 'Signet Ring', note: 'Brushed gold', price: '₹4,800' },
];

const SUGGESTIONS = ['Cheaper', 'Gold only', 'Ship by Fri'];

/**
 * AI shopping assistant — UI only, no live backend. `product_selling_app_agent/`
 * is docs-only today (see doc/AGENT_DEV_PLAN.md), so this screen is built
 * behind VITE_ENABLE_ASSISTANT (default off) with static demo content, ready
 * to be wired to the agent service once it exists. Reached directly while
 * the flag is off, it shows an honest "coming soon" state instead.
 */
const AssistantPage = () => {
  const [draft, setDraft] = useState('');

  if (!ASSISTANT_ENABLED) {
    return (
      <Container className="py-16">
        <EmptyState title="Assistant coming soon" description="The AI shopping assistant is not enabled yet." />
      </Container>
    );
  }

  return (
    <Container className="max-w-[720px]! py-6 lg:py-10">
      <div className="flex flex-col overflow-hidden rounded-hero border border-line bg-card">
        <div className="flex items-center gap-3 border-b border-line px-5 py-5">
          <span className="relative h-9.5 w-9.5 shrink-0 rounded-tile bg-ink">
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-accent" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-extrabold text-ink">ShopNow Assistant</p>
            <p className="text-[11px] font-bold text-accent">demo · not connected to a live agent</p>
          </div>
        </div>

        <div className="flex flex-col gap-3.5 px-5 py-5">
          <ChatBubble from="user">Gift for my sister, under ₹5,000, she likes minimal jewellery</ChatBubble>
          <ChatBubble from="assistant" delay={100}>
            Three picks in your budget. Tap one to add it — I'll keep the total live.
          </ChatBubble>

          <div className="flex flex-col gap-2">
            {PICKS.map((pick, i) => (
              <div
                key={pick.name}
                className="flex animate-up items-center gap-2.75 rounded-tile border border-line bg-card p-2.25 t-card hover:border-accent hover:shadow-lift-accent"
                style={{ animationDelay: `${150 + i * 60}ms` }}
              >
                <div className="bg-hatch h-11.5 w-11.5 shrink-0 rounded-[12px]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-bold text-ink">{pick.name}</p>
                  <p className="text-[10.5px] font-semibold text-muted">{pick.note}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-extrabold text-ink">{pick.price}</p>
                  <p className="text-[10px] font-extrabold text-accent">+ Add</p>
                </div>
              </div>
            ))}
          </div>

          <div className="animate-up rounded-tile border border-accent bg-soft2 p-3.5" style={{ animationDelay: '340ms' }}>
            <p className="mb-2.5 font-mono text-[11px] font-extrabold text-muted">MICRO CHECKOUT · DEMO</p>
            <div className="mb-1.5 flex justify-between text-xs font-bold">
              <span>Pendant + card</span>
              <span>₹4,500.00</span>
            </div>
            <div className="mb-3 flex justify-between text-[11.5px] font-semibold text-muted">
              <span>Gift wrap</span>
              <span>Free</span>
            </div>
            <button
              type="button"
              disabled
              title="Demo only — not wired to a live agent or payment"
              className="w-full cursor-not-allowed rounded-btn bg-line py-3.5 text-[13px] font-extrabold text-muted"
            >
              Pay ₹4,500.00 →
            </button>
          </div>

          <TypingDots />
        </div>

        <div className="flex gap-1.75 overflow-x-auto no-scrollbar px-5 pb-3.5">
          {SUGGESTIONS.map((s) => (
            <Chip key={s} disabled title="Demo only">
              {s}
            </Chip>
          ))}
        </div>

        <div className="flex items-center gap-2.5 border-t border-line px-5 py-3.5">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask anything… (demo — not connected)"
            className="flex-1 rounded-full border border-line px-4 py-3 text-[12.5px] text-ink placeholder:text-muted t-fast focus:border-accent"
          />
          <button
            type="button"
            disabled
            title="Demo only — not wired to a live agent"
            className="grid h-11 w-11 shrink-0 cursor-not-allowed place-items-center rounded-full bg-line text-muted"
          >
            <FiArrowUp size={18} />
          </button>
        </div>
      </div>
    </Container>
  );
};

export default AssistantPage;
