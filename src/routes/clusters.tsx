import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell, EmptyState } from "@/components/AppShell";
import { CategoryBadge } from "@/components/status";
import { RouteError, RoutePending } from "@/components/states";
import { clustersQuery } from "@/lib/queries";
import { fmtDate } from "@/lib/flakewatch-types";

export const Route = createFileRoute("/clusters")({
  head: () => ({
    meta: [
      { title: "Failure clusters | Flakewatch" },
      {
        name: "description",
        content:
          "Similar CI failures grouped by embedding similarity, with suggested root causes per cluster.",
      },
      { property: "og:title", content: "Failure clusters | Flakewatch" },
      {
        property: "og:description",
        content:
          "Similar CI failures grouped by embedding similarity, with suggested root causes per cluster.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(clustersQuery),
  component: Clusters,
  pendingComponent: () => <RoutePending title="Failure clusters" />,
  errorComponent: ({ error, reset }) => (
    <RouteError title="Failure clusters" error={error as Error} onRetry={reset} />
  ),
  notFoundComponent: () => (
    <AppShell title="Failure clusters" subtitle="Nothing here">
      <EmptyState message="No clusters found." />
    </AppShell>
  ),
});

function Clusters() {
  const { data } = useSuspenseQuery(clustersQuery);
  const clusters = data.clusters;
  const tests = data.tests;
  const [open, setOpen] = useState<string | null>(null);

  return (
    <AppShell
      title="Failure clusters"
      subtitle="Similar failures grouped by embedding similarity"
    >
      {clusters.length === 0 ? (
        <EmptyState message="No clusters yet — clusters form once failures share an embedding neighbourhood." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {clusters.map((c) => {
            const isOpen = open === c.clusterId;
            return (
              <section
                key={c.clusterId}
                className="rounded-lg border border-border bg-surface"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.clusterId)}
                  className="w-full px-4 py-3 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="label-xs">{c.clusterId}</span>
                    <CategoryBadge category={c.category} />
                  </div>
                  <p className="mt-2 font-mono text-[12px] leading-snug break-words text-flaky">
                    {c.representativeError}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
                    <span className="tabular">{c.affectedTests.length} tests</span>
                    <span className="tabular">{c.occurrences} occurrences</span>
                    <span>
                      {fmtDate(c.firstSeen)} → {fmtDate(c.lastSeen)}
                    </span>
                  </div>
                </button>
                <div className="border-t border-border px-4 py-3">
                  <span className="label-xs">Suggested root cause</span>
                  <p className="mt-1 text-[13px] text-foreground/90">{c.suggestedRootCause}</p>
                </div>
                {isOpen ? (
                  <div className="border-t border-border">
                    <div className="label-xs px-4 py-2">Member failures</div>
                    <ul className="divide-y divide-border/60">
                      {c.affectedTests.map((name) => {
                        const t = tests.find((x) => x.testName === name);
                        return (
                          <li key={name} className="flex items-center justify-between px-4 py-2">
                            {t ? (
                              <Link
                                to="/tests/$testId"
                                params={{ testId: t.testId }}
                                className="font-mono text-xs text-foreground underline-offset-2 hover:text-flaky hover:underline"
                              >
                                {name}
                              </Link>
                            ) : (
                              <span className="font-mono text-xs">{name}</span>
                            )}
                            {t ? (
                              <span className="tabular font-mono text-[11px] text-muted-foreground">
                                score {t.flakeScore}
                              </span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.clusterId)}
                  className="w-full border-t border-border px-4 py-2 text-left font-mono text-[10px] tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground"
                >
                  {isOpen ? "▲ collapse members" : "▼ expand members"}
                </button>
              </section>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
