export type FlakeStatus = "active" | "quarantined" | "resolved";
export type FlakeCategory =
  | "environment"
  | "timing"
  | "test_data"
  | "real_defect"
  | "unknown";

export interface FlakyTestSummary {
  testId: string;
  testName: string;
  suite: string;
  team: string;
  owner: string;
  framework: string;
  filePath: string;
  flakeScore: number;
  confidence: number;
  failureCount: number;
  totalRuns: number;
  lastFlaggedAt: string;
  status: FlakeStatus;
  category: FlakeCategory;
  scoreTrend: number[];
}

export interface TestRunHistory {
  runId: string;
  timestamp: string;
  status: "pass" | "fail" | "skip";
  durationMs: number;
  environment: string;
  retryCount: number;
  ciLink: string;
}

export interface ModelInsight {
  featureName: string;
  importance: number;
  description: string;
}

export const CATEGORY_LABEL: Record<FlakeCategory, string> = {
  environment: "Environment",
  timing: "Timing / race",
  test_data: "Test data",
  real_defect: "Real defect",
  unknown: "Unknown",
};

export const STATUS_LABEL: Record<FlakeStatus, string> = {
  active: "Active",
  quarantined: "Quarantined",
  resolved: "Resolved",
};

const NAMES: Array<[string, string, string, FlakeCategory, FlakeStatus, string]> = [
  ["checkout.applyCoupon", "payments", "Playwright", "timing", "active", "Payments"],
  ["auth.sessionRefresh", "identity", "Playwright", "environment", "quarantined", "Identity"],
  ["search.facetPaging", "catalog", "Karate", "timing", "active", "Discovery"],
  ["media.videoTranscode", "uploads", "Playwright", "real_defect", "active", "Media"],
  ["billing.recurringCharge", "payments", "Karate", "test_data", "quarantined", "Payments"],
  ["notify.emailTemplate", "comms", "Jest", "test_data", "active", "Growth"],
  ["webhooks.signatureVerify", "integrations", "Karate", "environment", "resolved", "Platform"],
  ["geo.latencyProbe", "edge", "Playwright", "environment", "active", "Infra"],
  ["cache.warmupOrder", "infra", "Jest", "timing", "quarantined", "Infra"],
  ["audit.logRetention", "compliance", "Karate", "unknown", "resolved", "Platform"],
  ["cart.syncInventory", "cart", "Playwright", "timing", "active", "Commerce"],
  ["reco.rankBoost", "ml", "Jest", "unknown", "active", "ML"],
  ["profile.avatarUpload", "identity", "Playwright", "environment", "active", "Identity"],
  ["orders.refundFlow", "payments", "Karate", "real_defect", "active", "Payments"],
  ["shipping.rateQuote", "logistics", "Jest", "timing", "resolved", "Commerce"],
  ["admin.bulkImport", "backoffice", "Playwright", "test_data", "active", "Platform"],
  ["feed.infiniteScroll", "catalog", "Playwright", "timing", "active", "Discovery"],
  ["i18n.currencyFormat", "catalog", "Jest", "unknown", "resolved", "Growth"],
];

function seeded(n: number) {
  let x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

export const TESTS: FlakyTestSummary[] = NAMES.map(
  ([testName, suite, framework, category, status, team], i) => {
    const score = Math.round(96 - i * 3.7 - seeded(i) * 6);
    const totalRuns = 180 + Math.round(seeded(i + 7) * 900);
    return {
      testId: testName.replace(/\./g, "-"),
      testName,
      suite,
      team,
      owner: `${team.toLowerCase()}-oncall`,
      framework,
      filePath: `tests/${suite}/${testName.split(".")[1]}.spec.ts`,
      flakeScore: Math.max(12, score),
      confidence: Math.round(72 + seeded(i + 3) * 26),
      failureCount: Math.max(2, Math.round(18 - i * 0.8 + seeded(i + 1) * 4)),
      totalRuns,
      lastFlaggedAt: new Date(
        Date.UTC(2026, 7, 29) - i * 36e5 * (6 + seeded(i) * 30),
      ).toISOString(),
      status,
      category,
      scoreTrend: Array.from({ length: 14 }, (_, d) =>
        Math.max(5, Math.min(100, score - 18 + Math.round(seeded(i * 14 + d) * 30) + d)),
      ),
    };
  },
);

export const TREND_30D = Array.from({ length: 30 }, (_, i) => {
  const day = new Date(Date.UTC(2026, 6, 31) + i * 864e5);
  return {
    date: day.toISOString().slice(5, 10),
    flaky: Math.round(18 + i * 0.55 + seeded(i) * 9),
    quarantined: Math.round(4 + i * 0.22 + seeded(i + 50) * 4),
  };
});

export const CATEGORY_BREAKDOWN: Array<{
  category: FlakeCategory;
  value: number;
}> = [
  { category: "timing", value: 74 },
  { category: "environment", value: 58 },
  { category: "real_defect", value: 38 },
  { category: "test_data", value: 27 },
  { category: "unknown", value: 15 },
];

export const SUMMARY = {
  testsTracked: 12480,
  flakyDetected: 212,
  flakyPct: 1.7,
  quarantined: 38,
  triageHoursSaved: 68.4,
};

export function runHistory(testId: string): TestRunHistory[] {
  const envs: string[] = ["ci-linux", "staging", "prod-canary", "ci-macos"];
  return Array.from({ length: 24 }, (_, i) => {
    const r = seeded(testId.length * 13 + i);
    const failed = r > 0.62;
    return {
      runId: `#${48210 - i}`,
      timestamp: new Date(Date.UTC(2026, 7, 29) - i * 41e5).toISOString(),
      status: failed ? "fail" : r < 0.06 ? "skip" : "pass",
      durationMs: Math.round(1800 + r * 9000),
      environment: envs[i % envs.length] ?? "ci-linux",
      retryCount: failed ? 1 + Math.round(r * 2) : 0,
      ciLink: `https://ci.example.com/builds/${48210 - i}`,
    };
  });
}

export const MODEL_FEATURES: ModelInsight[] = [
  { featureName: "historical flip-rate", importance: 0.28, description: "Pass/fail alternation across consecutive runs on the same commit" },
  { featureName: "execution time variance", importance: 0.21, description: "Std-dev of duration relative to suite median" },
  { featureName: "retry recovery rate", importance: 0.17, description: "Share of failures that pass on first retry" },
  { featureName: "environment skew", importance: 0.13, description: "Failures concentrated in a subset of environments" },
  { featureName: "parallel run correlation", importance: 0.11, description: "Failure rate vs. concurrent worker count" },
  { featureName: "assertion diversity", importance: 0.06, description: "Number of distinct failing assertions" },
  { featureName: "code churn proximity", importance: 0.04, description: "Recency of edits to files under test" },
];

export const MODEL_METRICS = {
  precision: 0.91,
  recall: 0.86,
  f1: 0.884,
  confusion: { tp: 186, fp: 18, fn: 30, tn: 1204 },
  lastTrained: "2026-08-27T04:12:00Z",
  version: "flake-clf v2.4.1",
};

export const RETRAIN_LOG = [
  { version: "v2.4.1", date: "2026-08-27", f1: 0.884, note: "Added retry-recovery feature" },
  { version: "v2.3.0", date: "2026-08-06", f1: 0.861, note: "Rebalanced timing class weights" },
  { version: "v2.2.2", date: "2026-07-18", f1: 0.842, note: "Human feedback batch (142 labels)" },
  { version: "v2.1.0", date: "2026-06-30", f1: 0.817, note: "Initial parallel-run correlation signal" },
];

export const FEEDBACK_QUEUE = [
  { testName: "orders.refundFlow", predicted: "timing", corrected: "real_defect", by: "m.okafor", date: "2026-08-28" },
  { testName: "geo.latencyProbe", predicted: "real_defect", corrected: "environment", by: "s.ravel", date: "2026-08-27" },
  { testName: "reco.rankBoost", predicted: "unknown", corrected: "test_data", by: "d.iyer", date: "2026-08-25" },
];

export interface FailureCluster {
  clusterId: string;
  representativeError: string;
  affectedTests: string[];
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  suggestedRootCause: string;
  category: FlakeCategory;
}

export const CLUSTERS: FailureCluster[] = [
  {
    clusterId: "clu-401",
    representativeError: "TimeoutError: locator.click: Timeout 30000ms exceeded waiting for [data-test=submit]",
    affectedTests: ["checkout.applyCoupon", "cart.syncInventory", "feed.infiniteScroll"],
    occurrences: 148,
    firstSeen: "2026-07-14",
    lastSeen: "2026-08-29",
    suggestedRootCause: "Submit button re-mounts after a late pricing fetch; click lands on a detached node.",
    category: "timing",
  },
  {
    clusterId: "clu-388",
    representativeError: "ECONNRESET: socket hang up (staging-eu-2)",
    affectedTests: ["auth.sessionRefresh", "geo.latencyProbe", "profile.avatarUpload"],
    occurrences: 96,
    firstSeen: "2026-06-28",
    lastSeen: "2026-08-28",
    suggestedRootCause: "Shared staging gateway drops idle keep-alive connections after 60s.",
    category: "environment",
  },
  {
    clusterId: "clu-372",
    representativeError: "AssertionError: expected balance 0.00 to equal 120.50",
    affectedTests: ["billing.recurringCharge", "orders.refundFlow"],
    occurrences: 61,
    firstSeen: "2026-07-02",
    lastSeen: "2026-08-26",
    suggestedRootCause: "Fixture seed reused across parallel workers; ledger rows leak between runs.",
    category: "test_data",
  },
  {
    clusterId: "clu-355",
    representativeError: "500 Internal Server Error POST /api/v1/transcode",
    affectedTests: ["media.videoTranscode"],
    occurrences: 34,
    firstSeen: "2026-08-11",
    lastSeen: "2026-08-29",
    suggestedRootCause: "Genuine regression in transcode worker after ffmpeg bump — not flaky.",
    category: "real_defect",
  },
];

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
