type ConfettiProps = {
  scale?: number;
};

const PARTICLES: [number, number][] = [
  [-70, -40],
  [70, -52],
  [-84, 36],
  [86, 30],
  [0, -84],
  [24, 80],
  [-30, 78],
];

/**
 * The success-screen confetti burst (Kartly Commerce Kit.dc.html
 * checkMark/confetti block). Purely decorative — respects
 * prefers-reduced-motion via the global guard in index.css, and the
 * caller should skip rendering it entirely when that's set.
 */
const Confetti = ({ scale = 1 }: ConfettiProps) => {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {PARTICLES.map(([tx, ty], i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: i % 2 ? 7 : 9,
            height: i % 2 ? 7 : 9,
            borderRadius: i % 2 ? '50%' : '3px',
            background: i % 3 === 0 ? 'var(--k-ink)' : 'var(--k-accent)',
            ['--tx' as string]: `${tx * scale}px`,
            ['--ty' as string]: `${ty * scale}px`,
            animation: `kfConf 1.5s ${0.35 + i * 0.06}s ease-out infinite`,
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
