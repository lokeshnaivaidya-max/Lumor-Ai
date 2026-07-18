export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="scene">
      <div className="ambient" />
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-16">
        {children}
      </div>
    </main>
  )
}
