import Link from "next/link"

export default function GlobalNotFound() {
  return (
    <div className="lm-scene">
      <div className="lm-light" />
      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        <p className="dm-meta mb-4">404 &mdash; Page not found</p>
        <h1 className="dm-heading mb-4">This page doesn&rsquo;t exist</h1>
        <p className="dm-body mb-8 text-center">
          The page you&rsquo;re looking for may have been moved, deleted, or never
          existed.
        </p>
        <Link href="/" className="lm-btn lm-btn--gold">
          Back to home
        </Link>
      </div>
    </div>
  )
}
