import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, Panel } from "@/components/AppShell";
import { CategoryBadge } from "@/components/status";
import {
  FEEDBACK_QUEUE,
  MODEL_FEATURES,
  MODEL_METRICS,
  RETRAIN_LOG,
  fmtDate,
  type FlakeCategory,
} from "@/lib/mock-data";

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
  component: ModelAdmin,
});

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function ModelAdmin() {
  const [threshold, setThreshold] = useState(70);
  const m = MODEL_METRICS;
  const c = m.confusion;

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
          <ul className="divide-y divide-border/60">
            {MODEL_FEATURES.map((f) => (
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
                    style={{ width: `${f.importance * 300}%` }}
                  />
                </div>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">{f.description}</p>
              </li>
            ))}
          </ul>
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
              onClick={() => toast.success("Threshold saved", { description: `Auto-quarantine at score ≥ ${threshold}` })}
              className="mt-4 w-full rounded-md bg-primary px-3 py-2 font-mono text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Save threshold
            </button>
          </div>
        </Panel>

        <Panel title="Retraining history" className="lg:col-span-1">
          <ul className="divide-y divide-border/60">
            {RETRAIN_LOG.map((r) => (
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
        </Panel>

        <Panel title="Manual feedback queue" className="lg:col-span-1">
          <ul className="divide-y divide-border/60">
            {FEEDBACK_QUEUE.map((f) => (
              <li key={f.testName} className="px-4 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs">{f.testName}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {f.by} · {fmtDate(f.date)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <CategoryBadge category={f.predicted as FlakeCategory} />
                  <span className="font-mono text-[10px] text-muted-foreground">→</span>
                  <CategoryBadge category={f.corrected as FlakeCategory} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
