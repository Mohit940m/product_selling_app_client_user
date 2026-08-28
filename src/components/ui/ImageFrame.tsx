import { useState } from 'react';

interface ImageFrameProps {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  rounded?: string;
}

/**
 * The universal image slot. Falls back to the prototype's hatched
 * "product shot" placeholder when `src` is missing, or when it fails to
 * load (e.g. a deleted Cloudinary asset, a broken URL) — so a broken or
 * absent image never renders as a blank box or the browser's raw broken-
 * image icon.
 */
const ImageFrame = ({ src, alt, className = '', imgClassName = '', rounded = '' }: ImageFrameProps) => {
  const [failed, setFailed] = useState(false);
  // Some callers (e.g. ProductDetailPage's gallery) reuse one ImageFrame
  // instance across a changing `src` as the shopper switches thumbnails.
  // Tracks the src `failed` applies to, catching and resetting it during
  // render on a change — React's own recommended "adjust state when a
  // prop changes" pattern, avoiding the extra render cycle an
  // effect-based reset would cost.
  const [failedSrc, setFailedSrc] = useState(src);
  if (src !== failedSrc) {
    setFailedSrc(src);
    if (failed) setFailed(false);
  }

  if (!src || failed) {
    return (
      <div className={`bg-hatch flex items-center justify-center ${rounded} ${className}`}>
        <span className="font-mono text-[9px] font-medium text-muted" aria-hidden="true">
          product shot
        </span>
        <span className="sr-only">{alt}</span>
      </div>
    );
  }

  return (
    <div className={`group overflow-hidden ${rounded} ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover t-slow group-hover:scale-105 ${imgClassName}`}
      />
    </div>
  );
};

export default ImageFrame;
