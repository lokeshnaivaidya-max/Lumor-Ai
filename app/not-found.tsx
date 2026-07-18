import Link from "next/link"

export default function GlobalNotFound() {
  return (
    <div className="scene">
      <div className="relative z-10 flex flex-col items-center text-center" style={{ maxWidth: 480 }}>
        <p className="meta mb-5">404 &mdash; Page not found</p>
        <h1 className="heading mb-5">This page doesn&rsquo;t exist</h1>
        <p className="body mb-8 text-center">
          The page you&rsquo;re looking for may have been moved, deleted, or never existed.
        </p>
        <Link href="/" className="btn btn--gold">
          Back to home
        </Link>
      </div>
    </div>
  )
}
