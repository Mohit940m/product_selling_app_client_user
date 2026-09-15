import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowUp, FiClock, FiPlus, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { agentErrorMessage, deleteConversation, getConversation, listConversations, sendChat } from '../api/agentApi';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import EmptyState from '../components/ui/EmptyState';
import Sheet from '../components/ui/Sheet';
import ChatBubble from '../components/assistant/ChatBubble';
import TypingDots from '../components/assistant/TypingDots';
import { ProductCardsBlock, ProductDetailBlock } from '../components/assistant/blocks/ProductBlocks';
import CartBlock from '../components/assistant/blocks/CartBlock';
import {
  CheckoutBlock,
  NoticeBlock,
  OrderBlock,
  OrdersBlock,
  PendingActionCard,
  WishlistBlock,
} from '../components/assistant/blocks/InfoBlocks';
import type { Block, ChatAction, ChatMessage, ChatResponse, ConversationSummary } from '../components/assistant/types';
import { ASSISTANT_ENABLED } from '../config/assistant';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const SUGGESTIONS = ['Show me jeans under ₹2000', 'What’s in my bag?', 'Where is my last order?', 'Anything on sale?'];

let localId = 0;
const nextId = () => `m${++localId}`;

const BlockView = ({ block }: { block: Block }) => {
  const noop = () => undefined;
  switch (block.type) {
    case 'products':
      return <ProductCardsBlock data={block.data} onCartChanged={noop} />;
    case 'product':
      return <ProductDetailBlock data={block.data} onCartChanged={noop} />;
    case 'cart':
      return <CartBlock data={block.data} />;
    case 'wishlist':
      return <WishlistBlock data={block.data} />;
    case 'orders':
      return <OrdersBlock data={block.data} />;
    case 'order':
      return <OrderBlock data={block.data} />;
    case 'checkout':
      return <CheckoutBlock data={block.data} />;
    case 'notice':
      return <NoticeBlock data={block.data} />;
    default:
      return null;
  }
};

/**
 * AI shopping assistant backed by product_selling_app_agent's /api/v1/chat,
 * which runs store actions through the server's MCP tools as this user.
 * Cards in replies are live: add to bag, change quantities, save to wishlist.
 */
const AssistantPage = () => {
  useDocumentTitle('Assistant');
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('userToken');
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const refreshConversations = useCallback(() => {
    listConversations()
      .then(setConversations)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (ASSISTANT_ENABLED && isLoggedIn) refreshConversations();
  }, [isLoggedIn, refreshConversations]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  if (!ASSISTANT_ENABLED) {
    return (
      <Container className="py-16">
        <EmptyState title="Assistant is turned off" description="The AI shopping assistant isn't enabled in this build." />
      </Container>
    );
  }

  if (!isLoggedIn) {
    return (
      <Container className="py-16">
        <EmptyState
          title="Log in to chat with the assistant"
          description="It can find products, manage your bag and wishlist, and track your orders."
          action={
            <Button variant="primary" onClick={() => navigate('/login')}>
              Log in
            </Button>
          }
        />
      </Container>
    );
  }

  const applyResponse = (response: ChatResponse) => {
    setConversationId(response.conversationId);
    setMessages((current) => [
      ...current,
      {
        id: nextId(),
        role: 'assistant',
        text: response.reply,
        blocks: response.blocks,
        pendingAction: response.pendingAction ? { ...response.pendingAction, status: 'pending' } : null,
      },
    ]);
    refreshConversations();
  };

  const run = async (userEntry: ChatMessage, body: { message?: string; action?: ChatAction }, settle: 'confirmed' | 'cancelled') => {
    if (busy) return;
    setBusy(true);
    setMessages((current) => [
      ...current.map((m) => (m.pendingAction?.status === 'pending' ? { ...m, pendingAction: { ...m.pendingAction, status: settle } } : m)),
      userEntry,
    ]);
    try {
      applyResponse(await sendChat({ conversationId, ...body }));
    } catch (err) {
      setMessages((current) => [
        ...current,
        { id: nextId(), role: 'assistant', text: '', blocks: [{ type: 'notice', data: { tone: 'error', message: agentErrorMessage(err) } }] },
      ]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput('');
    void run({ id: nextId(), role: 'user', kind: 'text', text: trimmed }, { message: trimmed }, 'cancelled');
  };

  const decide = (actionId: string, confirmed: boolean) => {
    const summary = messages.find((m) => m.pendingAction?.id === actionId)?.pendingAction?.summary ?? '';
    void run(
      { id: nextId(), role: 'user', kind: 'action', text: `${confirmed ? 'Confirmed' : 'Cancelled'}: ${summary}` },
      { action: { type: confirmed ? 'confirm' : 'cancel', actionId } },
      confirmed ? 'confirmed' : 'cancelled',
    );
  };

  const openConversation = async (id: string) => {
    setHistoryOpen(false);
    if (busy || id === conversationId) return;
    try {
      const detail = await getConversation(id);
      setConversationId(detail._id);
      setMessages(detail.messages.map((m) => ({ ...m, id: nextId() })));
    } catch (err) {
      toast.error(agentErrorMessage(err));
    }
  };

  const startNew = () => {
    setHistoryOpen(false);
    if (busy) return;
    setConversationId(null);
    setMessages([]);
  };

  const removeConversation = async (id: string) => {
    try {
      await deleteConversation(id);
      setConversations((current) => current.filter((c) => c._id !== id));
      if (id === conversationId) startNew();
    } catch (err) {
      toast.error(agentErrorMessage(err));
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const lastAssistantIndex = messages.map((m) => m.role).lastIndexOf('assistant');

  return (
    <Container className="max-w-[820px]! py-4 lg:py-8">
      <div className="flex h-[calc(100dvh-10.5rem)] min-h-[460px] flex-col overflow-hidden rounded-hero border border-line bg-card lg:h-[calc(100dvh-9rem)]">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5 sm:px-5">
          <span className="relative h-9.5 w-9.5 shrink-0 rounded-tile bg-ink" aria-hidden="true">
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-accent" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-extrabold text-ink">Shopping Assistant</h1>
            <p className="truncate text-[11px] font-bold text-accent">Finds products, manages your bag, tracks orders</p>
          </div>
          <Button variant="soft" size="sm" className="px-3! py-2!" icon={<FiClock size={14} />} onClick={() => setHistoryOpen(true)}>
            <span className="hidden sm:inline">Chats</span>
          </Button>
          <Button variant="dark" size="sm" className="px-3! py-2!" icon={<FiPlus size={14} />} onClick={startNew} disabled={busy}>
            <span className="hidden sm:inline">New</span>
          </Button>
        </div>

        <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-4 py-4 sm:px-5" aria-live="polite">
          {messages.length === 0 && (
            <div className="m-auto max-w-md text-center">
              <p className="text-[18px] font-extrabold text-ink">What are you shopping for?</p>
              <p className="mt-1 text-[12.5px] font-medium text-muted">
                Ask in your own words. I’ll show real products you can add to your bag right here.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <Chip key={s} onClick={() => send(s)} disabled={busy}>
                    {s}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, index) =>
            m.role === 'user' ? (
              m.kind === 'action' ? (
                <p key={m.id} className="mx-auto max-w-full rounded-full bg-soft2 px-3.5 py-1.5 text-center text-[11.5px] font-semibold text-muted">
                  {m.text}
                </p>
              ) : (
                <ChatBubble key={m.id} from="user">
                  <span className="whitespace-pre-wrap">{m.text}</span>
                </ChatBubble>
              )
            ) : (
              <div key={m.id} className="flex flex-col gap-2.5">
                {m.text && (
                  <ChatBubble from="assistant">
                    <span className="whitespace-pre-wrap">{m.text}</span>
                  </ChatBubble>
                )}
                {(m.blocks ?? []).map((block, i) => (
                  <BlockView key={`${m.id}-${i}`} block={block} />
                ))}
                {m.pendingAction && (
                  <PendingActionCard pending={m.pendingAction} isLatest={index === lastAssistantIndex} busy={busy} onDecide={decide} />
                )}
              </div>
            ),
          )}

          {busy && (
            <div className="w-fit rounded-[18px_18px_18px_5px] border border-line bg-soft2 px-3.75 py-3.5" role="status" aria-label="Assistant is typing">
              <TypingDots />
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={onSubmit} className="flex items-end gap-2.5 border-t border-line p-3 sm:p-4">
          <label htmlFor="assistant-input" className="sr-only">
            Message the assistant
          </label>
          <textarea
            id="assistant-input"
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={2000}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask for a product, your bag, or an order…"
            className="max-h-32 min-h-[46px] flex-1 resize-none rounded-full border border-line bg-transparent px-4.5 py-3 text-base font-medium text-ink placeholder:text-muted focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-[13px]"
          />
          <Button type="submit" variant="icon" disabled={busy || !input.trim()} aria-label="Send">
            <FiArrowUp size={18} />
          </Button>
        </form>
      </div>

      <Sheet open={historyOpen} onClose={() => setHistoryOpen(false)} title="Your chats">
        <div className="space-y-2">
          <Button variant="primary" size="sm" fullWidth icon={<FiPlus size={14} />} onClick={startNew} disabled={busy}>
            New chat
          </Button>
          {conversations.length === 0 && <p className="text-[12.5px] font-medium text-muted">No chats yet.</p>}
          <ul className="space-y-1">
            {conversations.map((c) => (
              <li key={c._id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openConversation(c._id)}
                  className={`min-w-0 flex-1 truncate rounded-btn px-3 py-2.5 text-left text-[13px] t-fast focus-visible:outline-2 focus-visible:outline-accent ${
                    c._id === conversationId ? 'bg-ink font-extrabold text-card' : 'font-semibold text-ink hover:bg-soft2'
                  }`}
                >
                  {c.title}
                </button>
                <button
                  type="button"
                  onClick={() => removeConversation(c._id)}
                  aria-label={`Delete chat ${c.title}`}
                  className="p-2 text-muted t-fast hover:text-danger"
                >
                  <FiTrash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Sheet>
    </Container>
  );
};

export default AssistantPage;
