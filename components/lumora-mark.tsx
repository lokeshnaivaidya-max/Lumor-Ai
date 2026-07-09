// The Lumora "L" mark — a precise, faceted letterform echoing the brand logo:
// a tall vertical spine and a lifted foot, cut with a single luminous chamfer.
// Rendered with currentColor by default so it adapts to any surface.
export function LumoraMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-label="Lumora"
      role="img"
    >
      <defs>
        <linearGradient id="lumora-spine" x1="14" y1="4" x2="30" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.92 0.02 250)" />
          <stop offset="0.5" stopColor="oklch(0.7 0.06 250)" />
          <stop offset="1" stopColor="oklch(0.52 0.05 255)" />
        </linearGradient>
        <linearGradient id="lumora-foot" x1="14" y1="34" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.66 0.05 252)" />
          <stop offset="1" stopColor="oklch(0.44 0.04 258)" />
        </linearGradient>
        <linearGradient id="lumora-facet" x1="24" y1="14" x2="32" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.98 0.01 250)" stopOpacity="0.95" />
          <stop offset="1" stopColor="oklch(0.9 0.02 250)" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Vertical spine — angled top terminal, tapered base */}
      <path
        d="M13.5 6.5 L21.5 4.2 L22.5 36 L15 39 Z"
        fill="url(#lumora-spine)"
      />
      {/* Luminous inner facet (the folded-light panel) */}
      <path
        d="M24 15 L30 13.2 L30.4 33.5 L24.4 35.4 Z"
        fill="url(#lumora-facet)"
      />
      {/* Lifted foot */}
      <path
        d="M15 39 L22.5 36 L43 32 L43 40 L15 44 Z"
        fill="url(#lumora-foot)"
      />
    </svg>
  )
}
