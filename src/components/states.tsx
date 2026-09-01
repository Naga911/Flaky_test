import { AppShell, Panel } from "@/components/AppShell";

export function RouteError({
  title,
  error,
  onRetry,
}: {
  title: string;
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <AppShell title={title} subtitle="Could not reach the Flakewatch API">
      <Panel title="Request failed">
        <div className="px-4 py-8 text-center">
          <p className="font-mono text-xs text-flaky">{error.message}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-md bg-primary px-3 py-2 font-mono text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Retry
            </button>
          ) : null}
        </div>
      </Panel>
    </AppShell>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className ?? "h-24"}`} />;
}

export function RoutePending({ title }: { title: string }) {
  return (
    <AppShell title={title} subtitle="Loading…">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-24" />
        ))}
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <SkeletonBlock className="h-64 lg:col-span-2" />
        <SkeletonBlock className="h-64" />
      </div>
      <SkeletonBlock className="mt-3 h-80" />
    </AppShell>
  );
}
