import { NavLink } from 'react-router-dom';

const ASSISTANT_ENABLED = import.meta.env.VITE_ENABLE_ASSISTANT === 'true';

interface Tab {
  label: string;
  to: string;
  end?: boolean;
}

interface BottomTabBarProps {
  cartCount: number;
}

const BASE_TABS: Tab[] = [
  { label: 'Shop', to: '/products', end: true },
  { label: 'Search', to: '/products?focus=search' },
];

const ASSISTANT_TAB: Tab = { label: 'AI', to: '/assistant' };

const END_TABS: Tab[] = [
  { label: 'Cart', to: '/cart' },
  { label: 'You', to: '/profile' },
];

/**
 * Mobile bottom tab bar (Kartly Commerce Kit.dc.html lines 137-143):
 * an accent dot above a label per tab, no icons. Hidden at `lg+`.
 */
const BottomTabBar = ({ cartCount }: BottomTabBarProps) => {
  const tabs: Tab[] = ASSISTANT_ENABLED
    ? [...BASE_TABS, ASSISTANT_TAB, ...END_TABS]
    : [...BASE_TABS, ...END_TABS];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="flex items-stretch justify-between px-2">
        {tabs.map(({ label, to, end }) => (
          <NavLink
            key={label}
            to={to}
            end={end}
            className="relative flex flex-1 flex-col items-center gap-1.5 py-3 text-muted"
          >
            {({ isActive }) => (
              <>
                <span
                  className={`t-base rounded-full ${isActive ? 'h-2 w-2 bg-accent' : 'h-1.5 w-1.5 bg-muted'}`}
                  aria-hidden="true"
                />
                <span className={`text-[10px] ${isActive ? 'font-bold text-ink' : 'font-semibold'}`}>{label}</span>
                {label === 'Cart' && cartCount > 0 && (
                  <span
                    key={cartCount}
                    className="absolute right-1/2 top-1 translate-x-3.5 animate-pop rounded-full bg-accent px-1 text-[9px] font-extrabold text-onacc"
                  >
                    {cartCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomTabBar;
