import { useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiEye } from 'react-icons/fi';
import Container from '../components/layout/Container';
import Panel from '../components/ui/Panel';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// Optional: set VITE_SUPPORT_EMAIL to show a contact address. Nothing in the
// app defines one yet, so the page doesn't invent it.
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL as string | undefined;

const LAST_UPDATED = '14 October 2026';

const Section = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
    <h2 id={`${id}-title`} className="mb-2.5 text-[17px] font-extrabold tracking-[-.01em] text-ink">
      {title}
    </h2>
    <div className="space-y-3 text-[14px] leading-relaxed text-muted [&_strong]:font-bold [&_strong]:text-ink">{children}</div>
  </section>
);

const List = ({ children }: { children: ReactNode }) => <ul className="list-disc space-y-1.5 pl-5 marker:text-line">{children}</ul>;

/**
 * Plain-language privacy policy describing what this storefront actually
 * collects and shares, verified against product_selling_app_server and
 * product_selling_app_agent. In particular it discloses that sellers can see
 * signed-in buyers who reach checkout with their products, even when the
 * buyer doesn't pay (GET /api/v1/seller/checkouts). Keep it in sync when
 * data handling changes.
 */
const PrivacyPolicyPage = () => {
  useDocumentTitle('Privacy Policy');
  const { hash } = useLocation();

  // AppLayout scrolls to the top after this effect runs, so jump to a linked
  // section (e.g. /privacy#sellers from checkout) on the next frame.
  useEffect(() => {
    if (!hash) return;
    const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, [hash]);

  return (
    <Container className="py-6 lg:py-10">
      <div className="mx-auto max-w-[760px]">
        <div className="mb-6 lg:mb-8">
          <p className="font-mono text-[11px] font-bold text-muted">LEGAL</p>
          <h1 className="mt-1.5 text-[22px] font-extrabold tracking-[-.02em] lg:text-[28px]">Privacy policy</h1>
          <p className="mt-1.5 text-[13px] font-medium text-muted">Last updated {LAST_UPDATED}</p>
        </div>

        <Panel className="mb-8 border-accent/40 bg-soft">
          <div className="flex gap-3">
            <FiEye size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            <div className="text-[14px] leading-relaxed text-ink">
              <p className="font-extrabold">Sellers can see who goes to checkout</p>
              <p className="mt-1 text-muted">
                When you're signed in and go to checkout, in the store or through the shopping assistant, each seller
                whose products are in your checkout can see your <strong className="text-ink">name, email address and
                phone number</strong>, the items of theirs you were buying, and whether you completed the order.{' '}
                <strong className="text-ink">This happens even if you don't pay.</strong> Details in{' '}
                <a href="#sellers" className="font-bold text-accent hover:underline">What sellers can see</a>.
              </p>
            </div>
          </div>
        </Panel>

        <div className="space-y-8">
          <Section id="intro" title="About this policy">
            <p>
              This policy explains what information ShopNow collects when you use the store and the shopping assistant,
              how we use it, and who can see it. ShopNow is a marketplace: products are listed and shipped by independent
              sellers.
            </p>
          </Section>

          <Section id="collect" title="Information we collect">
            <List>
              <li>
                <strong>Account details:</strong> your name, email address and/or phone number, and anything you add to
                your profile (date of birth, gender, profile photo).
              </li>
              <li>
                <strong>Addresses</strong> you save for delivery, including the name and phone number on them.
              </li>
              <li>
                <strong>Shopping activity:</strong> your cart, wishlist, orders, each item's delivery status, and
                cancellations and refunds.
              </li>
              <li>
                <strong>Checkout activity:</strong> when you go to checkout while signed in, we record the items, their
                prices, the time, whether you used the store or the shopping assistant, whether you opened the payment
                window, and whether the order was paid. We keep one open record per account and update it each time you
                return to checkout.
              </li>
              <li>
                <strong>Payment records:</strong> payment status and Razorpay's order and payment references. Card, UPI
                and bank details are entered with Razorpay and are never sent to or stored by us.
              </li>
              <li>
                <strong>Shopping assistant conversations:</strong> the messages you send, the assistant's replies, and
                the store data it looked up for you.
              </li>
              <li>
                <strong>Sign-in codes:</strong> one-time codes are stored only in scrambled (hashed) form and expire after
                5 minutes.
              </li>
            </List>
            <p>
              We don't track you while you browse without signing in, and guests can't reach checkout, so no checkout
              record is ever created for a guest.
            </p>
          </Section>

          <Section id="use" title="How we use it">
            <List>
              <li>To run your account, sign you in, and keep your cart, wishlist and addresses.</li>
              <li>To price your checkout, take payment through Razorpay, and get your order delivered.</li>
              <li>To answer you in the shopping assistant using live store data.</li>
              <li>To let sellers fulfil orders and follow up on checkouts that weren't completed, as described below.</li>
            </List>
          </Section>

          <Section id="sellers" title="What sellers can see">
            <p>Sellers only ever see information connected to their own products.</p>
            <p>
              <strong>When you go to checkout</strong> (signed in, in the store or through the shopping assistant), each
              seller with products in your checkout can see:
            </p>
            <List>
              <li>your name, email address and phone number (whichever your account or checkout address has);</li>
              <li>the items from that seller, with quantities and prices — not other sellers' items;</li>
              <li>when you were last at checkout and whether it was through the store or the assistant;</li>
              <li>whether you opened the payment window, and whether you went on to place the order.</li>
            </List>
            <p>
              This appears to the seller as soon as you reach checkout, even if you never pay. Sellers may use it to
              contact you about your unfinished order.
            </p>
            <p>
              <strong>When you place an order</strong>, the seller of each item also sees the order number, the items
              they're shipping and your delivery address (name, phone and address) so they can deliver it.
            </p>
          </Section>

          <Section id="providers" title="Services that process your data">
            <List>
              <li>
                <strong>Razorpay</strong> processes payments. We pass your name, email and phone to pre-fill the payment
                window.
              </li>
              <li>
                <strong>Google Gemini</strong> generates the shopping assistant's replies. Your messages, and the store
                data looked up for them, are sent to Google to do this.
              </li>
              <li>
                <strong>Cloudinary</strong> stores profile photos you upload.
              </li>
              <li>
                <strong>Hosting and database providers</strong> run our servers and store the data above.
              </li>
              <li>
                <strong>Google Fonts</strong> serves the site's fonts, so your browser connects to Google when pages load.
              </li>
            </List>
            <p>We don't sell your information or use advertising or analytics trackers.</p>
          </Section>

          <Section id="device" title="Stored on your device">
            <p>The site keeps a few things in your browser's local storage — no tracking cookies:</p>
            <List>
              <li>your sign-in token, so you stay signed in;</li>
              <li>your light/dark theme choice;</li>
              <li>whether you've already seen the welcome screen.</li>
            </List>
          </Section>

          <Section id="retention" title="How long we keep it">
            <p>
              Account, address, order, checkout and assistant records are kept while your account exists; there is no
              automatic deletion yet. Sign-in codes expire after 5 minutes. You can delete your own assistant
              conversations from the assistant.
            </p>
          </Section>

          <Section id="choices" title="Your choices">
            <List>
              <li>
                Edit your name, contact details and addresses any time in your{' '}
                <Link to="/profile" className="font-bold text-accent hover:underline">
                  profile
                </Link>
                .
              </li>
              <li>Browse without signing in — nothing is shared with sellers until you go to checkout.</li>
              <li>
                To get a copy of your data, or to ask us to correct or delete it,{' '}
                {SUPPORT_EMAIL ? (
                  <>
                    email{' '}
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="font-bold text-accent hover:underline">
                      {SUPPORT_EMAIL}
                    </a>
                    .
                  </>
                ) : (
                  'contact the ShopNow team. There is no in-app account deletion yet.'
                )}
              </li>
            </List>
          </Section>

          <Section id="changes" title="Changes to this policy">
            <p>
              When we change how your information is handled, we'll update this page and the date at the top.
            </p>
          </Section>
        </div>
      </div>
    </Container>
  );
};

export default PrivacyPolicyPage;
