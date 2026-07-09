export function LumoraMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-label="Lumora"
      role="img"
    >
      <defs>
        <linearGradient id="lumora-g" x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="oklch(0.72 0.16 245)" />
          <stop offset="0.55" stopColor="oklch(0.7 0.14 210)" />
          <stop offset="1" stopColor="oklch(0.8 0.14 165)" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" stroke="url(#lumora-g)" strokeWidth="1.4" opacity="0.5" />
      {/* Aperture / lumen petals */}
      <path
        d="M20 4 C24 13 27 16 36 20 C27 24 24 27 20 36 C16 27 13 24 4 20 C13 16 16 13 20 4Z"
        fill="url(#lumora-g)"
      />
      <circle cx="20" cy="20" r="4" fill="oklch(0.13 0.006 265)" />
      <circle cx="20" cy="20" r="1.6" fill="url(#lumora-g)" />
    </svg>
  )
}
