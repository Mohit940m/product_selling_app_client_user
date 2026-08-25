interface ImageFrameProps {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  rounded?: string;
}

/**
 * The universal image slot. Falls back to the prototype's hatched
 * "product shot" placeholder when `src` is missing, so a broken/absent
 * image never renders as a blank box.
 */
const ImageFrame = ({ src, alt, className = '', imgClassName = '', rounded = '' }: ImageFrameProps) => {
  if (!src) {
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
        className={`h-full w-full object-cover t-slow group-hover:scale-105 ${imgClassName}`}
      />
    </div>
  );
};

export default ImageFrame;
