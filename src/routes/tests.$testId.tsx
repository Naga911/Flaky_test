import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, EmptyState, Panel } from "@/components/AppShell";
import { DataTable, type Column } from "@/components/DataTable";
import { CategoryBadge, ScoreBar, Sparkline, StatusBadge, scoreColor } from "@/components/status";
import {
  CATEGORY_LABEL,
  TESTS,
  fmtDateTime,
  runHistory,
  type FlakeStatus,
  type TestRunHistory,
} from "@/lib/mock-data";

export const Route = createFileRoute("/tests/$testId")({
  loader: ({ params }) => {
    const test = TESTS.find((t) => t.testId === params.testId);
    if (!test) throw notFound();
    return { test, runs: runHistory(test.testId) };
  },
  head: ({ params }) => {
    const name = params.testId.replace(/-/g, ".");
    return {
      meta: [
        { title: `${name} — flake detail | Flakewatch` },
        {
          name: "description",
          content: `Run history, flake score trend and ML classification breakdown for ${name}.`,
        },
        { property: "og:title", content: `${name} — flake detail | Flakewatch` },
        {
          property: "og:description",
          content: `Run history, flake score trend and ML classification breakdown for ${name}.`,
        },
      ],
    };
  },
  component: TestDetail,
});

const FEATURES = [
  { label: "execution time variance", value: "high (2.8σ)", weight: 0.31 },
  { label: "environment skew", value: "staging-only failures", weight: 0.24 },
  { label: "parallel run correlation", value: "r = 0.71", weight: 0.19 },
  { label: "retry recovery rate", value: "83% pass on retry", weight: 0.16 },
  { label: "code churn proximity", value: "no recent edits", weight: 0.1 },
];

const ROOT_CAUSES = [
  {
    title: "Late pricing fetch re-mounts the submit button",
    detail: "Shapley attribution points at the async price refresh finishing after the click handler binds.",
    weight: "0.42",
  },
  {
    title: "Shared staging gateway drops idle connections",
    detail: "Failures cluster within 60s of the previous request on the same worker.",
    weight: "0.27",
  },
  {
    title: "Fixture seed reuse across parallel workers",
    detail: "Correlates with worker count above 6.",
    weight: "0.14",
  },
];

function TestDetail() {
  const { test, runs } = Route.useLoaderData();
  const [status, setStatus] = useState<FlakeStatus>(test.status);

  const columns: Array<Column<TestRunHistory>> = [
    {
      key: "run",
      header: "Run",
      sortValue: (r) => r.runId,
      cell: (r) => <span className="font-mono text-xs">{r.runId}</span>,
    },
    {
      key: "time",
      header: "Timestamp",
      sortValue: (r) => r.timestamp,
      cell: (r) => (
        <span className="font-mono text-[11px] text-muted-foreground">{fmtDateTime(r.timestamp)}</span>
      ),
    },
    {
      key: "status",
      header: "Result",
      sortValue: (r) => r.status,
      cell: (r) => (
        <span
          className={`font-mono text-xs uppercase ${
            r.status === "fail"
              ? "text-defect"
              : r.status === "skip"
                ? "text-quarantined"
                : "text-stable"
          }`}
        >
          {r.status}
        </span>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      align: "right",
      sortValue: (r) => r.durationMs,
      cell: (r) => <span className="tabular font-mono text-xs">{(r.durationMs / 1000).toFixed(1)}s</span>,
    },
    {
      key: "env",
      header: "Environment",
      sortValue: (r) => r.environment,
      cell: (r) => <span className="font-mono text-[11px] text-muted-foreground">{r.environment}</span>,
    },
    {
      key: "retries",
      header: "Retries",
      align: "right",
      sortValue: (r) => r.retryCount,
      cell: (r) => <span className="tabular font-mono text-xs">{r.retryCount}</span>,
    },
    {
      key: "ci",
      header: "CI",
      align: "right",
      cell: (r) => (
        <a
          href={r.ciLink}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[11px] text-flaky underline underline-offset-2"
        >
          build ↗
        </a>
      ),
    },
  ];

  return (
    <AppShell
      title={test.testName}
      subtitle={`${test.filePath} · ${test.framework} · ${test.team}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setStatus("quarantined");
              toast.success("Test quarantined", { description: test.testName });
            }}
            className="rounded-md border border-quarantined/40 bg-quarantined/10 px-3 py-1.5 font-mono text-xs text-quarantined transition-colors hover:bg-quarantined/20"
          >
            Quarantine
          </button>
          <button
            onClick={() => {
              setStatus("resolved");
              toast.success("Marked as resolved");
            }}
            className="rounded-md border border-stable/40 bg-stable/10 px-3 py-1.5 font-mono text-xs text-stable transition-colors hover:bg-stable/20"
          >
            Mark resolved
          </button>
          <button
            onClick={() => toast("Feedback queued for retraining")}
            className="rounded-md border border-border bg-secondary px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            False positive
          </button>
          <button
            onClick={() => toast(`Assigned to ${test.owner}`)}
            className="rounded-md border border-border bg-secondary px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Assign
          </button>
        </div>
      }
    >
      <Link to="/" className="label-xs mb-4 inline-block hover:text-foreground">
        ← back to overview
      </Link>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Flake score" className="lg:col-span-1">
          <div className="p-4">
            <div className="flex items-baseline gap-2">
              <span className={`tabular font-mono text-4xl font-semibold ${scoreColor(test.flakeScore)}`}>
                {test.flakeScore}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                ±{100 - test.confidence} · {test.confidence}% confidence
              </span>
            </div>
            <div className="mt-3">
              <Sparkline values={test.scoreTrend} />
              <div className="label-xs mt-1">14-day trend</div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              <CategoryBadge category={test.category} />
            </div>
            <dl className="mt-4 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">suite</dt>
                <dd>{test.suite}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">owner</dt>
                <dd>{test.owner}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">failures</dt>
                <dd className="tabular">
                  {test.failureCount} / {test.totalRuns}
                </dd>
              </div>
            </dl>
          </div>
        </Panel>

        <Panel title="ML classification" className="lg:col-span-1">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm">{CATEGORY_LABEL[test.category]}</span>
              <span className="tabular font-mono text-xs text-flaky">{test.confidence}%</span>
            </div>
            <ul className="mt-4 space-y-2.5">
              {FEATURES.map((f) => (
                <li key={f.label}>
                  <div className="flex items-baseline justify-between font-mono text-[11px]">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span>{f.value}</span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-flaky" style={{ width: `${f.weight * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel title="Root cause suggestions" className="lg:col-span-1">
          <ul className="divide-y divide-border">
            {ROOT_CAUSES.map((c) => (
              <li key={c.title} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[13px] font-medium">{c.title}</span>
                  <span className="tabular font-mono text-[11px] text-flaky">{c.weight}</span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{c.detail}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Run history" className="mt-3">
        {runs.length === 0 ? (
          <EmptyState message="No runs recorded for this test yet." />
        ) : (
          <DataTable
            rows={runs}
            columns={columns}
            getKey={(r) => r.runId}
            searchKeys={(r) => [r.runId, r.environment, r.status]}
            searchPlaceholder="Search run or environment…"
            filters={[
              {
                key: "result",
                label: "Result",
                options: [
                  { value: "pass", label: "Pass" },
                  { value: "fail", label: "Fail" },
                  { value: "skip", label: "Skip" },
                ],
              },
            ]}
            filterMatch={(r, _k, v) => r.status === v}
            initialSort={{ key: "time", dir: "desc" }}
          />
        )}
      </Panel>

    </AppShell>
  );
}
