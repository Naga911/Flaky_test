import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, Panel } from "@/components/AppShell";
import { DataTable, type Column } from "@/components/DataTable";
import { CATEGORY_COLOR, CategoryBadge, ScoreBar, StatusBadge } from "@/components/status";
import {
  CATEGORY_BREAKDOWN,
  CATEGORY_LABEL,
  SUMMARY,
  TESTS,
  TREND_30D,
  fmtDate,
  type FlakyTestSummary,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flakewatch — Flaky Test Detection Dashboard" },
      {
        name: "description",
        content:
          "Triage CI failures fast: flake scores, ML classification and auto-quarantine across your test suites.",
      },
      { property: "og:title", content: "Flakewatch — Flaky Test Detection Dashboard" },
      {
        property: "og:description",
        content:
          "Triage CI failures fast: flake scores, ML classification and auto-quarantine across your test suites.",
      },
    ],
  }),
  component: Overview,
});

function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="label-xs">{label}</div>
      <div className={`tabular mt-2 font-mono text-3xl font-semibold ${tone ?? ""}`}>{value}</div>
      <div className="mt-1 font-mono text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}

function chartTooltip() {
  return {
    contentStyle: {
      background: "var(--popover)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      fontSize: 12,
      fontFamily: "var(--font-mono)",
    },
    labelStyle: { color: "var(--muted-foreground)" },
  };
}

function Overview() {
  const navigate = useNavigate();

  const columns: Array<Column<FlakyTestSummary>> = [
    {
      key: "test",
      header: "Test",
      sortValue: (r) => r.testName,
      cell: (r) => (
        <div>
          <div className="font-mono text-[13px] text-foreground">{r.testName}</div>
          <div className="font-mono text-[10px] text-muted-foreground">
            {r.suite} · {r.team} · {r.framework}
          </div>
        </div>
      ),
    },
    {
      key: "score",
      header: "Flake score",
      width: "150px",
      sortValue: (r) => r.flakeScore,
      cell: (r) => <ScoreBar score={r.flakeScore} />,
    },
    {
      key: "failures",
      header: "Failures",
      align: "right",
      width: "110px",
      sortValue: (r) => r.failureCount,
      cell: (r) => (
        <span className="tabular font-mono text-xs">
          {r.failureCount}
          <span className="text-muted-foreground">/{r.totalRuns}</span>
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      width: "140px",
      sortValue: (r) => r.category,
      cell: (r) => <CategoryBadge category={r.category} />,
    },
    {
      key: "flagged",
      header: "Last flagged",
      align: "right",
      width: "130px",
      sortValue: (r) => r.lastFlaggedAt,
      cell: (r) => (
        <span className="font-mono text-[11px] text-muted-foreground">{fmtDate(r.lastFlaggedAt)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      width: "130px",
      sortValue: (r) => r.status,
      cell: (r) => <StatusBadge status={r.status} />,
    },
  ];

  return (
    <AppShell title="Flaky test overview" subtitle="Last 30 days · all pipelines">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Tests tracked" value={SUMMARY.testsTracked.toLocaleString()} hint="+214 this week" />
        <Metric
          label="Flaky detected"
          value={`${SUMMARY.flakyDetected}`}
          hint={`${SUMMARY.flakyPct}% of suite`}
          tone="text-flaky"
        />
        <Metric
          label="Auto-quarantined"
          value={`${SUMMARY.quarantined}`}
          hint="4 pending review"
          tone="text-quarantined"
        />
        <Metric
          label="Triage hours saved"
          value={`${SUMMARY.triageHoursSaved}`}
          hint="estimated, last 30d"
          tone="text-stable"
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel title="Flaky tests · 30 days" className="lg:col-span-2">
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND_30D} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="flakeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--flaky)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--flaky)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  interval={5}
                />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip {...chartTooltip()} />
                <Area
                  type="monotone"
                  dataKey="flaky"
                  stroke="var(--flaky)"
                  strokeWidth={2}
                  fill="url(#flakeFill)"
                />
                <Area
                  type="monotone"
                  dataKey="quarantined"
                  stroke="var(--quarantined)"
                  strokeWidth={1.5}
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Failure categories">
          <div className="flex items-center gap-4 p-4">
            <div className="h-40 w-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CATEGORY_BREAKDOWN}
                    dataKey="value"
                    nameKey="category"
                    innerRadius={44}
                    outerRadius={70}
                    paddingAngle={2}
                    stroke="var(--surface)"
                  >
                    {CATEGORY_BREAKDOWN.map((d) => (
                      <Cell key={d.category} fill={CATEGORY_COLOR[d.category]} />
                    ))}
                  </Pie>
                  <Tooltip {...chartTooltip()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-2">
              {CATEGORY_BREAKDOWN.map((d) => (
                <li key={d.category} className="flex items-center gap-2 font-mono text-[11px]">
                  <span
                    className="size-2 shrink-0 rounded-sm"
                    style={{ background: CATEGORY_COLOR[d.category] }}
                  />
                  <span className="text-muted-foreground">{CATEGORY_LABEL[d.category]}</span>
                  <span className="tabular ml-auto">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      <Panel title="Top 10 flakiest tests" className="mt-3">
        <DataTable
          rows={TESTS}
          columns={columns}
          getKey={(r) => r.testId}
          searchKeys={(r) => [r.testName, r.suite, r.team, r.status]}
          searchPlaceholder="Search test, suite or team…"
          filters={[
            {
              key: "status",
              label: "Status",
              options: [
                { value: "active", label: "Active" },
                { value: "quarantined", label: "Quarantined" },
                { value: "resolved", label: "Resolved" },
              ],
            },
            {
              key: "category",
              label: "Category",
              options: Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label })),
            },
          ]}
          filterMatch={(r, key, value) =>
            key === "status" ? r.status === value : r.category === value
          }
          initialSort={{ key: "score", dir: "desc" }}
          pageSize={10}
          onRowClick={(r) => navigate({ to: "/tests/$testId", params: { testId: r.testId } })}
        />
      </Panel>
    </AppShell>
  );
}
