import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const statusSchema = z.enum(["active", "quarantined", "resolved"]);
const categorySchema = z.enum([
  "environment",
  "timing",
  "test_data",
  "real_defect",
  "unknown",
]);

export const getOverview = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchOverview } = await import("./flakewatch.server");
  return fetchOverview();
});

export const getTestDetail = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ testId: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { fetchTestDetail } = await import("./flakewatch.server");
    return fetchTestDetail(data.testId);
  });

export const getClusters = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchClusters } = await import("./flakewatch.server");
  return fetchClusters();
});

export const getModelInsights = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchModel } = await import("./flakewatch.server");
  return fetchModel();
});

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchSettings } = await import("./flakewatch.server");
  return fetchSettings();
});

export const updateSettings = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        githubEnabled: z.boolean().optional(),
        jenkinsEnabled: z.boolean().optional(),
        gitlabEnabled: z.boolean().optional(),
        githubWebhook: z.string().optional(),
        jenkinsWebhook: z.string().optional(),
        gitlabWebhook: z.string().optional(),
        slackEnabled: z.boolean().optional(),
        emailEnabled: z.boolean().optional(),
        slackChannel: z.string().optional(),
        notifyEmail: z.string().optional(),
        autoQuarantine: z.boolean().optional(),
        quarantineThreshold: z.number().int().min(0).max(100).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { saveSettings } = await import("./flakewatch.server");
    return saveSettings(data);
  });

export const setTestStatus = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ testId: z.string().min(1), status: statusSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const { updateTestStatus } = await import("./flakewatch.server");
    return updateTestStatus(data.testId, data.status);
  });

export const submitFeedback = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        testName: z.string().min(1),
        predicted: categorySchema,
        corrected: categorySchema,
        by: z.string().min(1).max(64),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { insertFeedback } = await import("./flakewatch.server");
    return insertFeedback(data);
  });

export const setQuarantineThreshold = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ threshold: z.number().int().min(0).max(100) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { updateThreshold, saveSettings } = await import("./flakewatch.server");
    const res = await updateThreshold(data.threshold);
    await saveSettings({ quarantineThreshold: data.threshold });
    return res;
  });
