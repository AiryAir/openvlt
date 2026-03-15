export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-4">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 size-[500px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 size-[400px] rounded-full bg-primary/3 blur-[100px]" />

      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  )
}
