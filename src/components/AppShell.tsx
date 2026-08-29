import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Overview" },
  { to: "/clusters", label: "Clusters" },
  { to: "/admin/model", label: "Model" },
  { to: "/settings", label: "Settings" },
] as const;

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4 md:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="grid size-6 place-items-center rounded bg-flaky font-mono text-[11px] font-bold text-flaky-foreground">
              F
            </span>
            <span className="font-mono text-sm font-semibold tracking-tight">flakewatch</span>
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-md px-2.5 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-stable/40 bg-stable/10 px-2 py-1 font-mono text-[10px] tracking-wider text-stable uppercase sm:inline-flex">
              <span className="size-1.5 animate-pulse rounded-full bg-stable" />
              live
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="label-xs mt-1">{subtitle}</p> : null}
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}

export function Panel({
  title,
  right,
  className,
  children,
}: {
  title?: string;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-lg border border-border bg-surface ${className ?? ""}`}
    >
      {title ? (
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="label-xs">{title}</h2>
          {right}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="font-mono text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <div className="h-3 flex-1 animate-pulse rounded bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
