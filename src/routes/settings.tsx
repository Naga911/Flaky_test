import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, EmptyState, Panel } from "@/components/AppShell";
import { RouteError, RoutePending } from "@/components/states";
import { settingsQuery } from "@/lib/queries";
import { updateSettings } from "@/lib/flakewatch.functions";
import type { AppSettings } from "@/lib/flakewatch-types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings | Flakewatch" },
      {
        name: "description",
        content: "CI webhook integrations, notification rules and auto-quarantine policy.",
      },
      { property: "og:title", content: "Settings | Flakewatch" },
      {
        property: "og:description",
        content: "CI webhook integrations, notification rules and auto-quarantine policy.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  component: Settings,
  pendingComponent: () => <RoutePending title="Settings" />,
  errorComponent: ({ error, reset }) => (
    <RouteError title="Settings" error={error as Error} onRetry={reset} />
  ),
  notFoundComponent: () => (
    <AppShell title="Settings" subtitle="Nothing here">
      <EmptyState message="Settings are unavailable." />
    </AppShell>
  ),
});

function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left disabled:opacity-60"
    >
      <span>
        <span className="block text-sm">{label}</span>
        <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">{hint}</span>
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-flaky" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-background transition-all ${
            checked ? "left-4.5" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function Settings() {
  const { data } = useSuspenseQuery(settingsQuery);
  const qc = useQueryClient();
  const [form, setForm] = useState<AppSettings>(data);

  useEffect(() => {
    setForm(data);
  }, [data]);

  const saveFn = useServerFn(updateSettings);
  const save = useMutation({
    mutationFn: (patch: Partial<AppSettings>) => saveFn({ data: patch }),
    onSuccess: (_r, patch) => {
      void qc.invalidateQueries({ queryKey: ["settings"] });
      void qc.invalidateQueries({ queryKey: ["model"] });
      toast.success("Settings saved", { description: Object.keys(patch).join(", ") });
    },
    onError: (err: Error, _patch) => {
      setForm(data);
      toast.error("Could not save settings", { description: err.message });
    },
  });

  function patch(next: Partial<AppSettings>) {
    setForm((s) => ({ ...s, ...next }));
    save.mutate(next);
  }

  const pending = save.isPending;

  return (
    <AppShell
      title="Settings"
      subtitle={pending ? "Saving…" : "Integrations · notifications · policy"}
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="CI/CD webhooks">
          <div className="divide-y divide-border/60">
            <div className="px-4 py-3">
              <label className="label-xs" htmlFor="gh-url">GitHub Actions</label>
              <input
                id="gh-url"
                value={form.githubWebhook}
                placeholder="https://api.flakewatch.dev/hooks/github/…"
                onChange={(e) => setForm((s) => ({ ...s, githubWebhook: e.target.value }))}
                onBlur={(e) => {
                  if (e.target.value !== data.githubWebhook) patch({ githubWebhook: e.target.value });
                }}
                className="mt-1.5 h-8 w-full rounded-md border border-input bg-background px-2.5 font-mono text-xs outline-none placeholder:text-muted-foreground focus:border-ring"
              />
              <Toggle
                checked={form.githubEnabled}
                disabled={pending}
                onChange={(v) => patch({ githubEnabled: v })}
                label="Ingest GitHub Actions runs"
                hint="POST junit + step events after each workflow"
              />
            </div>
            <div className="px-4 py-3">
              <label className="label-xs" htmlFor="jk-url">Jenkins</label>
              <input
                id="jk-url"
                value={form.jenkinsWebhook}
                placeholder="https://api.flakewatch.dev/hooks/jenkins/…"
                onChange={(e) => setForm((s) => ({ ...s, jenkinsWebhook: e.target.value }))}
                onBlur={(e) => {
                  if (e.target.value !== data.jenkinsWebhook) patch({ jenkinsWebhook: e.target.value });
                }}
                className="mt-1.5 h-8 w-full rounded-md border border-input bg-background px-2.5 font-mono text-xs outline-none placeholder:text-muted-foreground focus:border-ring"
              />
              <Toggle
                checked={form.jenkinsEnabled}
                disabled={pending}
                onChange={(v) => patch({ jenkinsEnabled: v })}
                label="Ingest Jenkins runs"
                hint="Requires the flakewatch Jenkins plugin"
              />
            </div>
            <div className="px-4 py-3">
              <label className="label-xs" htmlFor="gl-url">GitLab CI</label>
              <input
                id="gl-url"
                value={form.gitlabWebhook}
                placeholder="https://api.flakewatch.dev/hooks/gitlab/…"
                onChange={(e) => setForm((s) => ({ ...s, gitlabWebhook: e.target.value }))}
                onBlur={(e) => {
                  if (e.target.value !== data.gitlabWebhook) patch({ gitlabWebhook: e.target.value });
                }}
                className="mt-1.5 h-8 w-full rounded-md border border-input bg-background px-2.5 font-mono text-xs outline-none placeholder:text-muted-foreground focus:border-ring"
              />
              <Toggle
                checked={form.gitlabEnabled}
                disabled={pending}
                onChange={(v) => patch({ gitlabEnabled: v })}
                label="Ingest GitLab CI runs"
                hint="Group-level webhook, pipelines scope"
              />
            </div>
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Notifications">
            <div className="divide-y divide-border/60">
              <Toggle
                checked={form.slackEnabled}
                disabled={pending}
                onChange={(v) => patch({ slackEnabled: v })}
                label="Slack alert on threshold cross"
                hint={`${form.slackChannel || "#qa-flakes"} · fires when score ≥ threshold`}
              />
              <Toggle
                checked={form.emailEnabled}
                disabled={pending}
                onChange={(v) => patch({ emailEnabled: v })}
                label="Email digest"
                hint={`Daily 09:00 UTC to ${form.notifyEmail || "team owners"}`}
              />
            </div>
          </Panel>

          <Panel title="Auto-quarantine policy">
            <div className="divide-y divide-border/60">
              <Toggle
                checked={form.autoQuarantine}
                disabled={pending}
                onChange={(v) => patch({ autoQuarantine: v })}
                label="Auto-quarantine flaky tests"
                hint={`Skip in CI when score stays ≥ ${form.quarantineThreshold} for 3 days`}
              />
            </div>
            <div className="border-t border-border px-4 py-3">
              <p className="font-mono text-[11px] text-muted-foreground">
                Quarantined tests are tagged <span className="text-quarantined">flaky-quarantine</span> and
                excluded from blocking the pipeline, but still run for signal collection.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
