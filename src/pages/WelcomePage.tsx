import { useNavigate } from 'react-router-dom';
import BrandMark from '../components/layout/BrandMark';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const WELCOME_SEEN_KEY = 'kartlySeenWelcome';

/**
 * First-visit onboarding screen (Kartly Commerce Kit.dc.html screen 01).
 * Shown once: App.tsx's root redirect sends here only when the flag is
 * unset and there's no logged-in user; both actions below set the flag.
 */
const WelcomePage = () => {
  useDocumentTitle('Welcome');
  const navigate = useNavigate();

  const dismiss = (to: string) => {
    try {
      localStorage.setItem(WELCOME_SEEN_KEY, '1');
    } catch {
      // localStorage unavailable — still navigate, just re-shows next visit.
    }
    navigate(to);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-10 text-ink">
      <button
        type="button"
        onClick={() => dismiss('/products')}
        className="absolute right-6 top-6 text-sm font-bold text-muted hover:text-accent"
      >
        Skip
      </button>

      <div className="mx-auto w-full max-w-[420px] text-center">
        <div className="mb-8 flex justify-center">
          <BrandMark size={32} showSubLabel />
        </div>

        <div className="relative mx-auto mb-9 flex items-center justify-center" style={{ width: 320, height: 260 }}>
          <div className="absolute h-[220px] w-[220px] rounded-full bg-soft" />
          <div className="bg-hatch2 relative flex h-[230px] w-[280px] animate-float items-center justify-center rounded-hero border border-line">
            <span className="font-mono text-[10px] font-medium text-muted">hero illustration</span>
          </div>
        </div>

        <h1 className="font-extrabold text-[30px] leading-[1.15] tracking-[-.03em]">
          Everything you
          <br />
          want, delivered.
        </h1>
        <p className="mt-3 text-sm font-medium text-muted">
          Shop any category, pay in two taps, track every order live.
        </p>

        <div className="mb-7 mt-6 flex justify-center gap-1.5">
          <span className="h-1.5 w-6.5 rounded-full bg-accent" />
          <span className="h-1.5 w-1.5 rounded-full bg-line" />
          <span className="h-1.5 w-1.5 rounded-full bg-line" />
        </div>

        <button
          type="button"
          onClick={() => dismiss('/login')}
          className="w-full rounded-tile bg-ink py-4 text-[15px] font-bold text-card t-base hover:shadow-lift-ink"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomePage;
