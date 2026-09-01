import { queryOptions } from "@tanstack/react-query";
import {
  getClusters,
  getModelInsights,
  getOverview,
  getSettings,
  getTestDetail,
} from "./flakewatch.functions";

export const overviewQuery = queryOptions({
  queryKey: ["overview"],
  queryFn: () => getOverview(),
});

export const clustersQuery = queryOptions({
  queryKey: ["clusters"],
  queryFn: () => getClusters(),
});

export const modelQuery = queryOptions({
  queryKey: ["model"],
  queryFn: () => getModelInsights(),
});

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: () => getSettings(),
});

export const testDetailQuery = (testId: string) =>
  queryOptions({
    queryKey: ["test", testId],
    queryFn: () => getTestDetail({ data: { testId } }),
  });
