interface BrandMarkProps {
  name?: string;
  subLabel?: string;
  size?: number;
  inverted?: boolean;
  showSubLabel?: boolean;
  className?: string;
}

/**
 * The Kartly-style wordmark: an ink tile with an accent dot pinned at its
 * corner, plus the brand name. Shared across the storefront top nav,
 * bottom tab bar context, and auth screens. `name` defaults to the
 * storefront's own brand ("ShopNow") — "Kartly" is the design kit, not
 * the product being built.
 */
const BrandMark = ({
  name = 'ShopNow',
  subLabel = 'marketplace',
  size = 32,
  inverted = false,
  showSubLabel = false,
  className = '',
}: BrandMarkProps) => {
  const dotSize = Math.round(size * 0.4);

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className="relative shrink-0 rounded-[11px]"
        style={{ width: size, height: size, background: inverted ? 'var(--k-accent)' : 'var(--k-ink)' }}
      >
        <span
          className="absolute rounded-full"
          style={{
            width: dotSize,
            height: dotSize,
            top: -dotSize / 3,
            right: -dotSize / 3,
            background: inverted ? '#fff' : 'var(--k-accent)',
          }}
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className={`font-extrabold tracking-[-.02em] ${inverted ? 'text-card' : 'text-ink'}`} style={{ fontSize: size * 0.53 }}>
          {name}
        </span>
        {showSubLabel && (
          <span className="mt-0.5 font-mono text-[10px] font-medium text-muted">{subLabel}</span>
        )}
      </span>
    </span>
  );
};

export default BrandMark;
