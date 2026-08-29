import { cn } from "@/lib/utils";
import type { FlakeCategory, FlakeStatus } from "@/lib/mock-data";
import { CATEGORY_LABEL, STATUS_LABEL } from "@/lib/mock-data";

const statusClass: Record<FlakeStatus, string> = {
  active: "border-flaky/40 bg-flaky/10 text-flaky",
  quarantined: "border-quarantined/40 bg-quarantined/10 text-quarantined",
  resolved: "border-stable/40 bg-stable/10 text-stable",
};

const categoryClass: Record<FlakeCategory, string> = {
  timing: "border-flaky/40 bg-flaky/10 text-flaky",
  environment: "border-info/40 bg-info/10 text-info",
  test_data: "border-quarantined/40 bg-quarantined/10 text-quarantined",
  real_defect: "border-defect/40 bg-defect/10 text-defect",
  unknown: "border-border bg-muted text-muted-foreground",
};

export const CATEGORY_COLOR: Record<FlakeCategory, string> = {
  timing: "var(--flaky)",
  environment: "var(--info)",
  test_data: "var(--quarantined)",
  real_defect: "var(--defect)",
  unknown: "var(--muted-foreground)",
};

export function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider whitespace-nowrap",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: FlakeStatus }) {
  return <Pill className={statusClass[status]}>{STATUS_LABEL[status]}</Pill>;
}

export function CategoryBadge({ category }: { category: FlakeCategory }) {
  return <Pill className={categoryClass[category]}>{CATEGORY_LABEL[category]}</Pill>;
}

export function scoreColor(score: number) {
  if (score >= 70) return "text-flaky";
  if (score >= 40) return "text-quarantined";
  return "text-stable";
}

export function ScoreBar({ score }: { score: number }) {
  const tone = score >= 70 ? "bg-flaky" : score >= 40 ? "bg-quarantined" : "bg-stable";
  return (
    <div className="flex items-center gap-2">
      <span className={cn("tabular font-mono text-sm font-semibold", scoreColor(score))}>
        {score}
      </span>
      <div className="h-1 w-14 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function Sparkline({ values, color }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - min) / span) * 26}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-full">
      <polyline
        points={pts}
        fill="none"
        stroke={color ?? "var(--flaky)"}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
