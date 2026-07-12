import { PortfolioClient } from "./portfolio-client"

export const metadata = {
  title: "Portfolio — Lumora AI",
  description: "Manage your holdings, track performance, and get AI-powered portfolio insights.",
}

export default function PortfolioPage() {
  return <PortfolioClient />
}
