import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type {
  AppSettings,
  CategorySlice,
  FailureCluster,
  FeedbackEntry,
  FlakeCategory,
  FlakeStatus,
  FlakyTestSummary,
  ModelInsight,
  ModelMetrics,
  RetrainEntry,
  SummaryMetrics,
  TestRunHistory,
  TrendPoint,
} from "./flakewatch-types";

export function db() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  if (res.data === null) throw new Error("No data returned");
  return res.data;
}

type TestRow = Database["public"]["Tables"]["flaky_tests"]["Row"];
type RunRow = Database["public"]["Tables"]["test_runs"]["Row"];

export function mapTest(r: TestRow): FlakyTestSummary {
  return {
    testId: r.test_id,
    testName: r.test_name,
    suite: r.suite,
    team: r.team,
    owner: r.owner,
    framework: r.framework,
    filePath: r.file_path,
    flakeScore: r.flake_score,
    confidence: r.confidence,
    failureCount: r.failure_count,
    totalRuns: r.total_runs,
    lastFlaggedAt: r.last_flagged_at,
    status: r.status as FlakeStatus,
    category: r.category as FlakeCategory,
    scoreTrend: r.score_trend ?? [],
  };
}

export function mapRun(r: RunRow): TestRunHistory {
  return {
    runId: r.run_id,
    timestamp: r.ran_at,
    status: r.status as TestRunHistory["status"],
    durationMs: r.duration_ms,
    environment: r.environment,
    retryCount: r.retry_count,
    ciLink: r.ci_link,
  };
}

export async function fetchOverview(): Promise<{
  summary: SummaryMetrics;
  trend: TrendPoint[];
  categories: CategorySlice[];
  tests: FlakyTestSummary[];
}> {
  const client = db();
  const [summaryRes, trendRes, catRes, testsRes] = await Promise.all([
    client.from("summary_metrics").select("*").eq("id", 1).maybeSingle(),
    client.from("flake_trend").select("*").order("ordinal", { ascending: true }),
    client.from("category_breakdown").select("*").order("value", { ascending: false }),
    client.from("flaky_tests").select("*").order("flake_score", { ascending: false }),
  ]);
  if (summaryRes.error) throw new Error(summaryRes.error.message);
  const s = summaryRes.data;
  return {
    summary: {
      testsTracked: s?.tests_tracked ?? 0,
      flakyDetected: s?.flaky_detected ?? 0,
      flakyPct: Number(s?.flaky_pct ?? 0),
      quarantined: s?.quarantined ?? 0,
      triageHoursSaved: Number(s?.triage_hours_saved ?? 0),
    },
    trend: unwrap(trendRes).map((t) => ({
      date: t.day_label,
      flaky: t.flaky,
      quarantined: t.quarantined,
    })),
    categories: unwrap(catRes).map((c) => ({
      category: c.category as FlakeCategory,
      value: c.value,
    })),
    tests: unwrap(testsRes).map(mapTest),
  };
}

export async function fetchTestDetail(testId: string) {
  const client = db();
  const [testRes, runsRes] = await Promise.all([
    client.from("flaky_tests").select("*").eq("test_id", testId).maybeSingle(),
    client
      .from("test_runs")
      .select("*")
      .eq("test_id", testId)
      .order("ran_at", { ascending: false })
      .limit(50),
  ]);
  if (testRes.error) throw new Error(testRes.error.message);
  if (!testRes.data) return null;
  return { test: mapTest(testRes.data), runs: unwrap(runsRes).map(mapRun) };
}

export async function fetchClusters(): Promise<{
  clusters: FailureCluster[];
  tests: FlakyTestSummary[];
}> {
  const client = db();
  const [clustersRes, testsRes] = await Promise.all([
    client.from("failure_clusters").select("*").order("occurrences", { ascending: false }),
    client.from("flaky_tests").select("*"),
  ]);
  return {
    clusters: unwrap(clustersRes).map((c) => ({
      clusterId: c.cluster_id,
      representativeError: c.representative_error,
      affectedTests: c.affected_tests ?? [],
      occurrences: c.occurrences,
      firstSeen: c.first_seen,
      lastSeen: c.last_seen,
      suggestedRootCause: c.suggested_root_cause,
      category: c.category as FlakeCategory,
    })),
    tests: unwrap(testsRes).map(mapTest),
  };
}

export async function fetchModel(): Promise<{
  metrics: ModelMetrics;
  features: ModelInsight[];
  retrainLog: RetrainEntry[];
  feedback: FeedbackEntry[];
}> {
  const client = db();
  const [metricsRes, featuresRes, logRes, feedbackRes] = await Promise.all([
    client.from("model_metrics").select("*").eq("id", 1).maybeSingle(),
    client.from("model_features").select("*").order("ordinal", { ascending: true }),
    client.from("retrain_log").select("*").order("trained_on", { ascending: false }),
    client.from("feedback_queue").select("*").order("submitted_on", { ascending: false }),
  ]);
  if (metricsRes.error) throw new Error(metricsRes.error.message);
  const m = metricsRes.data;
  if (!m) throw new Error("Model metrics unavailable");
  return {
    metrics: {
      precision: Number(m.precision),
      recall: Number(m.recall),
      f1: Number(m.f1),
      confusion: { tp: m.tp, fp: m.fp, fn: m.fn, tn: m.tn },
      lastTrained: m.last_trained,
      version: m.version,
      quarantineThreshold: m.quarantine_threshold,
    },
    features: unwrap(featuresRes).map((f) => ({
      featureName: f.feature_name,
      importance: Number(f.importance),
      description: f.description,
    })),
    retrainLog: unwrap(logRes).map((r) => ({
      version: r.version,
      date: r.trained_on,
      f1: Number(r.f1),
      note: r.note,
    })),
    feedback: unwrap(feedbackRes).map((f) => ({
      id: f.id,
      testName: f.test_name,
      predicted: f.predicted as FlakeCategory,
      corrected: f.corrected as FlakeCategory,
      by: f.submitted_by,
      date: f.submitted_on,
    })),
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  githubEnabled: true,
  jenkinsEnabled: false,
  gitlabEnabled: false,
  githubWebhook: "",
  jenkinsWebhook: "",
  gitlabWebhook: "",
  slackEnabled: true,
  emailEnabled: false,
  slackChannel: "#flaky-alerts",
  notifyEmail: "",
  autoQuarantine: true,
  quarantineThreshold: 85,
};

export async function fetchSettings(): Promise<AppSettings> {
  const res = await db().from("app_settings").select("settings").eq("id", 1).maybeSingle();
  if (res.error) throw new Error(res.error.message);
  return { ...DEFAULT_SETTINGS, ...((res.data?.settings as Partial<AppSettings>) ?? {}) };
}

export async function saveSettings(
  patch: { [K in keyof AppSettings]?: AppSettings[K] | undefined },
): Promise<AppSettings> {
  const current = await fetchSettings();
  const clean = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  ) as Partial<AppSettings>;
  const next = { ...current, ...clean };
  const res = await db()
    .from("app_settings")
    .upsert({ id: 1, settings: next, updated_at: new Date().toISOString() })
    .select("settings")
    .maybeSingle();
  if (res.error) throw new Error(res.error.message);
  return next;
}

export async function updateTestStatus(testId: string, status: FlakeStatus) {
  const res = await db()
    .from("flaky_tests")
    .update({ status })
    .eq("test_id", testId)
    .select("*")
    .maybeSingle();
  if (res.error) throw new Error(res.error.message);
  if (!res.data) throw new Error("Test not found");
  return mapTest(res.data);
}

export async function insertFeedback(entry: {
  testName: string;
  predicted: FlakeCategory;
  corrected: FlakeCategory;
  by: string;
}) {
  const res = await db()
    .from("feedback_queue")
    .insert({
      test_name: entry.testName,
      predicted: entry.predicted,
      corrected: entry.corrected,
      submitted_by: entry.by,
    })
    .select("id")
    .maybeSingle();
  if (res.error) throw new Error(res.error.message);
  return { ok: true as const };
}

export async function updateThreshold(threshold: number) {
  const res = await db()
    .from("model_metrics")
    .update({ quarantine_threshold: threshold })
    .eq("id", 1)
    .select("quarantine_threshold")
    .maybeSingle();
  if (res.error) throw new Error(res.error.message);
  return { quarantineThreshold: res.data?.quarantine_threshold ?? threshold };
}
