// The Lumora "L" mark — a faithful, faceted rendition of the brand logo:
// a folded navy prism spine split by a luminous light-fold, sweeping into an
// upturned steel-ice blade. Metallic gradients are baked in so the mark reads
// as the brand on any surface. Add the `.sweep`/`.sweep-hover` utility on a
// wrapper to animate the reflection.
export function LumoraMark({
  className = "h-8 w-8",
  title = "Lumora",
}: {
  className?: string
  title?: string
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id="lm-dark" x1="14" y1="10" x2="21" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.42 0.06 258)" />
          <stop offset="1" stopColor="oklch(0.26 0.05 260)" />
        </linearGradient>
        <linearGradient id="lm-mid" x1="20" y1="6" x2="25" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.6 0.08 250)" />
          <stop offset="1" stopColor="oklch(0.4 0.07 256)" />
        </linearGradient>
        <linearGradient id="lm-fold" x1="18" y1="7" x2="23" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.96 0.02 228)" />
          <stop offset="0.5" stopColor="oklch(0.86 0.05 235)" />
          <stop offset="1" stopColor="oklch(0.62 0.06 248)" />
        </linearGradient>
        <linearGradient id="lm-blade" x1="16" y1="42" x2="44" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.5 0.06 256)" />
          <stop offset="0.55" stopColor="oklch(0.78 0.06 236)" />
          <stop offset="1" stopColor="oklch(0.93 0.035 228)" />
        </linearGradient>
      </defs>

      {/* Spine — back/left dark face */}
      <path d="M14.5 12 L18.5 9 L20 40 L15.5 40 Z" fill="url(#lm-dark)" />
      {/* Spine — luminous light-fold */}
      <path d="M18.5 9 L20.6 7 L22.6 39 L20 40 Z" fill="url(#lm-fold)" />
      {/* Spine — right lit face rising to the apex */}
      <path d="M20.6 7 L23.2 4.6 L24 39 L22.6 39 Z" fill="url(#lm-mid)" />

      {/* Blade foot — the upturned sweeping plane */}
      <path
        d="M15.6 39.4 L24 38.4 Q35.5 33 43.6 29.4 Q44.6 32 43 35 Q32.5 40.6 17.6 44 Z"
        fill="url(#lm-blade)"
      />
      {/* Blade highlight edge */}
      <path
        d="M24.4 38.1 Q35.5 32.8 43 29.6"
        stroke="oklch(0.97 0.02 226)"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.8"
        fill="none"
      />
    </svg>
  )
}
