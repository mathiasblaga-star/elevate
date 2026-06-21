// Elevate brand mark — line-art ascending-building / growth motif.
// Strokes inherit currentColor, so colour it with a text-* class.
// ponytail: SVG recreation of the supplied logo; swap app/icon.svg + this path data for a pixel-exact trace if needed.
export function Logo({ className = "h-6 w-6 text-ink" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M30 52 L60 28 L66 32 L66 68" />
      <path d="M30 52 L30 68" />
      <path d="M27 68 L69 68" />
      <path d="M42 68 L42 42" />
      <path d="M54 68 L54 33" />
    </svg>
  );
}
