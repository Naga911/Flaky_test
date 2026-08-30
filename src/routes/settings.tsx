import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, Panel } from "@/components/AppShell";

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
  component: Settings,
});

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => {
        onChange(!checked);
        toast.success(`${label} ${!checked ? "enabled" : "disabled"}`);
      }}
      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
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
  const [webhooks, setWebhooks] = useState({
    github: true,
    jenkins: false,
    gitlab: false,
  });
  const [notify, setNotify] = useState({ slack: true, email: false });
  const [autoQuarantine, setAutoQuarantine] = useState(true);

  return (
    <AppShell title="Settings" subtitle="Integrations · notifications · policy">
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="CI/CD webhooks">
          <div className="divide-y divide-border/60">
            <div className="px-4 py-3">
              <label className="label-xs" htmlFor="gh-url">GitHub Actions</label>
              <input
                id="gh-url"
                defaultValue="https://api.flakewatch.dev/hooks/github/acme-app"
                className="mt-1.5 h-8 w-full rounded-md border border-input bg-background px-2.5 font-mono text-xs outline-none focus:border-ring"
              />
              <Toggle
                checked={webhooks.github}
                onChange={(v) => setWebhooks((s) => ({ ...s, github: v }))}
                label="Ingest GitHub Actions runs"
                hint="POST junit + step events after each workflow"
              />
            </div>
            <div className="px-4 py-3">
              <label className="label-xs" htmlFor="jk-url">Jenkins</label>
              <input
                id="jk-url"
                placeholder="https://api.flakewatch.dev/hooks/jenkins/…"
                className="mt-1.5 h-8 w-full rounded-md border border-input bg-background px-2.5 font-mono text-xs outline-none placeholder:text-muted-foreground focus:border-ring"
              />
              <Toggle
                checked={webhooks.jenkins}
                onChange={(v) => setWebhooks((s) => ({ ...s, jenkins: v }))}
                label="Ingest Jenkins runs"
                hint="Requires the flakewatch Jenkins plugin"
              />
            </div>
            <div className="px-4 py-3">
              <label className="label-xs" htmlFor="gl-url">GitLab CI</label>
              <input
                id="gl-url"
                placeholder="https://api.flakewatch.dev/hooks/gitlab/…"
                className="mt-1.5 h-8 w-full rounded-md border border-input bg-background px-2.5 font-mono text-xs outline-none placeholder:text-muted-foreground focus:border-ring"
              />
              <Toggle
                checked={webhooks.gitlab}
                onChange={(v) => setWebhooks((s) => ({ ...s, gitlab: v }))}
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
                checked={notify.slack}
                onChange={(v) => setNotify((s) => ({ ...s, slack: v }))}
                label="Slack alert on threshold cross"
                hint="#qa-flakes · fires when score ≥ threshold"
              />
              <Toggle
                checked={notify.email}
                onChange={(v) => setNotify((s) => ({ ...s, email: v }))}
                label="Email digest"
                hint="Daily 09:00 UTC to team owners"
              />
            </div>
          </Panel>

          <Panel title="Auto-quarantine policy">
            <div className="divide-y divide-border/60">
              <Toggle
                checked={autoQuarantine}
                onChange={setAutoQuarantine}
                label="Auto-quarantine flaky tests"
                hint="Skip in CI when score stays ≥ 70 for 3 days"
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
