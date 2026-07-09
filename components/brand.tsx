import Link from "next/link"
import { LumoraMark } from "./lumora-mark"
import { IconSpark } from "./lumora-icons"

/* The logo's signature divider: a hairline broken by the 4-point brand star. */
export function StarDivider({
  className = "",
  width = "w-full",
}: {
  className?: string
  width?: string
}) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <span className={`hairline ${width}`} />
      <IconSpark className="h-3 w-3 shrink-0 text-accent/80" />
      <span className={`hairline ${width}`} />
    </div>
  )
}

/* The Lumora lockup — faceted mark + inscriptional wordmark. */
export function BrandLockup({
  href = "/",
  markClass = "h-7 w-7",
  showWord = true,
}: {
  href?: string
  markClass?: string
  showWord?: boolean
}) {
  return (
    <Link href={href} className="group flex items-center gap-2.5">
      <span className="sweep sweep-hover inline-flex rounded-md">
        <LumoraMark className={markClass} />
      </span>
      {showWord && (
        <span className="wordmark text-[15px] text-foreground/95">LUMORA</span>
      )}
    </Link>
  )
}
