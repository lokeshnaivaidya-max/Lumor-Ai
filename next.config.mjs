/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    // Configure Lumora logo optimization
    formats: ["image/avif", "image/webp"],
  },
  // Configure favicon for Lumora brand logo
  eslint: {
    dirs: [".", "components", "app", "lib", "pages", "src"],
  },
  // Configure metadata for Lumora logo
  ...(typeof process.env.GENERATED_STATIC_EXPORTS === 'undefined' && {
    generateSitemap: false,
    // Ensure logo is included in static generation
    experimental: {
      optimizeCss: true,
      optimizePackageImports: true,
    },
  }),
}

// Build-time env diagnostic — logs SMTP key names only (never values)
const smtpKeys = Object.keys(process.env).filter((key) => key.startsWith("SMTP"))
console.log("[BUILD:DENV] SMTP keys present:", JSON.stringify(smtpKeys))
console.log("[BUILD:DENV] VERCEL_ENV:", process.env.VERCEL_ENV ?? "not set")
console.log("[BUILD:DENV] NODE_ENV:", process.env.NODE_ENV ?? "not set")

export default nextConfig
