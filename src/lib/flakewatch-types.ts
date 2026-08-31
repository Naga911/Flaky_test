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

export interface TrendPoint {
  date: string;
  flaky: number;
  quarantined: number;
}

export interface CategorySlice {
  category: FlakeCategory;
  value: number;
}

export interface SummaryMetrics {
  testsTracked: number;
  flakyDetected: number;
  flakyPct: number;
  quarantined: number;
  triageHoursSaved: number;
}

export interface ModelMetrics {
  precision: number;
  recall: number;
  f1: number;
  confusion: { tp: number; fp: number; fn: number; tn: number };
  lastTrained: string;
  version: string;
  quarantineThreshold: number;
}

export interface RetrainEntry {
  version: string;
  date: string;
  f1: number;
  note: string;
}

export interface FeedbackEntry {
  id: string;
  testName: string;
  predicted: FlakeCategory;
  corrected: FlakeCategory;
  by: string;
  date: string;
}

export interface AppSettings {
  githubEnabled: boolean;
  jenkinsEnabled: boolean;
  gitlabEnabled: boolean;
  githubWebhook: string;
  jenkinsWebhook: string;
  gitlabWebhook: string;
  slackEnabled: boolean;
  emailEnabled: boolean;
  slackChannel: string;
  notifyEmail: string;
  autoQuarantine: boolean;
  quarantineThreshold: number;
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
