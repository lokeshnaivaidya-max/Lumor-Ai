// The Lumora icon family — a cohesive set drawn from the logo's language:
// faceted planes, folded prisms, and the 4-point brand star. Thin, precise
// strokes on a 24-grid replace generic AI glyphs across the product.
import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement> & {
  className?: string
  strokeWidth?: number
}

function Icon({
  className = "h-5 w-5",
  strokeWidth = 1.6,
  children,
  ...rest
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

/* The brand 4-point star — used as spark, bullet, and divider node. */
export function IconSpark({ className = "h-5 w-5", ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path d="M12 2c.55 5.2 4.8 9.45 10 10-5.2.55-9.45 4.8-10 10-.55-5.2-4.8-9.45-10-10 5.2-.55 9.45-4.8 10-10Z" />
    </svg>
  )
}

/* Faceted prism — the "intelligence core" (replaces Brain). */
export function IconPrism(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2.5 20 9 12 21.5 4 9Z" />
      <path d="M12 2.5V21.5" />
      <path d="M4 9h16" />
    </Icon>
  )
}

export function IconGlobe(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.6 12h16.8" />
      <path d="M12 3.5c2.7 2.5 2.7 14.5 0 17M12 3.5c-2.7 2.5-2.7 14.5 0 17" />
    </Icon>
  )
}

export function IconChart(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 4v16.5H20" />
      <path d="M7 15l3.5-3.8 2.6 2.2 5.4-6.2" />
      <path d="M15.5 7.2h3.5v3.4" />
    </Icon>
  )
}

export function IconNews(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6h13v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <path d="M17 9h3v8a2 2 0 0 1-2 2" />
      <path d="M7.5 9.5h6M7.5 13h6M7.5 16h3.5" />
    </Icon>
  )
}

export function IconPulse(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 12h4l2.4-6.5 4.2 13 2.4-6.5h5.5" />
    </Icon>
  )
}

export function IconShield(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3 19 6v5.2c0 4.8-3.4 7.8-7 9.8-3.6-2-7-5-7-9.8V6Z" />
      <path d="M9 12l2 2 4-4.5" />
    </Icon>
  )
}

export function IconArrowUpRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 17 17 7" />
      <path d="M8.5 7H17v8.5" />
    </Icon>
  )
}

export function IconArrowDownRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 7l10 10" />
      <path d="M17 8.5V17H8.5" />
    </Icon>
  )
}

export function IconArrowRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 12h15" />
      <path d="M13 6l6 6-6 6" />
    </Icon>
  )
}

export function IconArrowLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </Icon>
  )
}

export function IconTrendUp(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 15.5 8.5 10l3.5 3.5 6-6.5" />
      <path d="M16.5 7h4.5v4.5" />
    </Icon>
  )
}

export function IconTrendDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 8.5 8.5 14l3.5-3.5 6 6.5" />
      <path d="M16.5 17h4.5v-4.5" />
    </Icon>
  )
}

export function IconClock(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.2V12l3.2 2" />
    </Icon>
  )
}

export function IconSearch(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M15.8 15.8 20.5 20.5" />
    </Icon>
  )
}

export function IconStop(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 7.5 7.5 7h9l.5.5v9l-.5.5h-9L7 16.5Z" />
    </Icon>
  )
}

/* Spinner ring — pair with `animate-spin` on the className. */
export function IconSpinner({ className = "h-5 w-5", strokeWidth = 1.8, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <circle cx="12" cy="12" r="8.5" opacity="0.25" />
      <path d="M20.5 12A8.5 8.5 0 0 0 12 3.5" />
    </svg>
  )
}

export function IconMenu(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />
    </Icon>
  )
}

export function IconClose(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  )
}
