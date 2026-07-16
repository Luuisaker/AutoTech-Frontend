type LogoProps = {
  size?: number;
  withText?: boolean;
  className?: string;
};

export function Logo({ size = 32, withText = false, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="shrink-0 place-items-center rounded-md border border-border-strong bg-surface"
        style={{ width: size, height: size, display: "grid" }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="text-primary"
          style={{ width: size * 0.6, height: size * 0.6 }}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="4" width="16" height="12" rx="2" />
          <circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="15" cy="9" r="1.5" fill="currentColor" stroke="none" />
          <path d="M8 14h8" />
          <path d="M6 16v3" />
          <path d="M18 16v3" />
          <path d="M12 16v4" />
          <path d="M10 20h4" />
        </svg>
      </div>
      {withText && (
        <span className="text-base font-semibold tracking-tight text-foreground">
          AutoTech
        </span>
      )}
    </div>
  );
}
