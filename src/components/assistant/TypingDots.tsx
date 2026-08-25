const TypingDots = () => (
  <div className="flex items-center gap-1.5 pl-1" aria-hidden="true">
    <span className="h-1.5 w-1.5 animate-dot rounded-full bg-accent" />
    <span className="h-1.5 w-1.5 animate-dot rounded-full bg-accent" style={{ animationDelay: '.2s' }} />
    <span className="h-1.5 w-1.5 animate-dot rounded-full bg-accent" style={{ animationDelay: '.4s' }} />
  </div>
);

export default TypingDots;
