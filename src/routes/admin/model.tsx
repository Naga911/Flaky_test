import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, EmptyState, Panel } from "@/components/AppShell";
import { CategoryBadge } from "@/components/status";
import { RouteError, RoutePending } from "@/components/states";
import { modelQuery } from "@/lib/queries";
import { setQuarantineThreshold } from "@/lib/flakewatch.functions";
import { fmtDate } from "@/lib/flakewatch-types";

export const Route = createFileRoute("/admin/model")({
  head: () => ({
    meta: [
      { title: "Model insights | Flakewatch" },
      {
        name: "description",
        content:
          "Precision, recall and F1 for the flaky classifier, feature importance, retraining history and the manual feedback queue.",
      },
      { property: "og:title", content: "Model insights | Flakewatch" },
      {
        property: "og:description",
        content:
          "Precision, recall and F1 for the flaky classifier, feature importance, retraining history and the manual feedback queue.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(modelQuery),
  component: ModelAdmin,
  pendingComponent: () => <RoutePending title="Model insights" />,
  errorComponent: ({ error, reset }) => (
    <RouteError title="Model insights" error={error as Error} onRetry={reset} />
  ),
  notFoundComponent: () => (
    <AppShell title="Model insights" subtitle="Nothing here">
      <EmptyState message="No model metrics available yet." />
    </AppShell>
  ),
});

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function ModelAdmin() {
  const { data } = useSuspenseQuery(modelQuery);
  const m = data.metrics;
  const c = m.confusion;
  const qc = useQueryClient();
  const [threshold, setThreshold] = useState(m.quarantineThreshold);

  useEffect(() => {
    setThreshold(m.quarantineThreshold);
  }, [m.quarantineThreshold]);

  const saveThresholdFn = useServerFn(setQuarantineThreshold);
  const saveThreshold = useMutation({
    mutationFn: (value: number) => saveThresholdFn({ data: { threshold: value } }),
    onSuccess: (_r, value) => {
      void qc.invalidateQueries({ queryKey: ["model"] });
      void qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Threshold saved", {
        description: `Auto-quarantine at score ≥ ${value}`,
      });
    },
    onError: (err: Error) => toast.error("Could not save threshold", { description: err.message }),
  });

  return (
    <AppShell
      title="Model insights"
      subtitle={`${m.version} · last trained ${fmtDate(m.lastTrained)}`}
    >
      <div className="grid grid-cols-3 gap-3">
        {(
          [
            ["Precision", m.precision],
            ["Recall", m.recall],
            ["F1", m.f1],
          ] as const
        ).map(([label, v]) => (
          <div key={label} className="rounded-lg border border-border bg-surface p-4">
            <div className="label-xs">{label}</div>
            <div className="tabular mt-2 font-mono text-2xl font-semibold text-flaky sm:text-3xl">
              {pct(v)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Panel title="Confusion matrix">
          <div className="grid grid-cols-[auto_1fr_1fr] gap-1 p-4 text-center">
            <span />
            <span className="label-xs">pred: flaky</span>
            <span className="label-xs">pred: stable</span>
            <span className="label-xs self-center">actual: flaky</span>
            <span className="tabular rounded-md bg-flaky/15 px-2 py-3 font-mono text-lg text-flaky">{c.tp}</span>
            <span className="tabular rounded-md bg-muted px-2 py-3 font-mono text-lg text-muted-foreground">{c.fn}</span>
            <span className="label-xs self-center">actual: stable</span>
            <span className="tabular rounded-md bg-muted px-2 py-3 font-mono text-lg text-muted-foreground">{c.fp}</span>
            <span className="tabular rounded-md bg-stable/15 px-2 py-3 font-mono text-lg text-stable">{c.tn}</span>
          </div>
        </Panel>

        <Panel title="Feature importance">
          {data.features.length === 0 ? (
            <EmptyState message="No feature weights published for this model version." />
          ) : (
            <ul className="divide-y divide-border/60">
              {data.features.map((f) => (
                <li key={f.featureName} className="px-4 py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-xs">{f.featureName}</span>
                    <span className="tabular font-mono text-[11px] text-flaky">
                      {f.importance.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-flaky"
                      style={{ width: `${Math.min(100, f.importance * 300)}%` }}
                    />
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">{f.description}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel title="Auto-quarantine threshold" className="lg:col-span-1">
          <div className="p-4">
            <div className="flex items-baseline justify-between">
              <span className="tabular font-mono text-3xl font-semibold text-flaky">{threshold}</span>
              <span className="font-mono text-[11px] text-muted-foreground">flake score ≥</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="mt-4 w-full accent-(--flaky)"
              aria-label="Auto-quarantine threshold"
            />
            <div className="label-xs mt-1 flex justify-between">
              <span>lenient · 10</span>
              <span>strict · 100</span>
            </div>
            <button
              type="button"
              disabled={saveThreshold.isPending}
              onClick={() => saveThreshold.mutate(threshold)}
              className="mt-4 w-full rounded-md bg-primary px-3 py-2 font-mono text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saveThreshold.isPending ? "Saving…" : "Save threshold"}
            </button>
          </div>
        </Panel>

        <Panel title="Retraining history" className="lg:col-span-1">
          {data.retrainLog.length === 0 ? (
            <EmptyState message="No retraining runs recorded." />
          ) : (
            <ul className="divide-y divide-border/60">
              {data.retrainLog.map((r) => (
                <li key={r.version} className="px-4 py-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-xs">{r.version}</span>
                    <span className="tabular font-mono text-[11px] text-muted-foreground">
                      {fmtDate(r.date)} · F1 {r.f1}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{r.note}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Manual feedback queue" className="lg:col-span-1">
          {data.feedback.length === 0 ? (
            <EmptyState message="No manual corrections submitted yet." />
          ) : (
            <ul className="divide-y divide-border/60">
              {data.feedback.map((f) => (
                <li key={f.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs">{f.testName}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {f.by} · {fmtDate(f.date)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <CategoryBadge category={f.predicted} />
                    <span className="font-mono text-[10px] text-muted-foreground">→</span>
                    <CategoryBadge category={f.corrected} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
