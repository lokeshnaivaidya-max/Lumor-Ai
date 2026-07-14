export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        {children}
      </main>
    </>
  )
}
