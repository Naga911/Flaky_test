CREATE TABLE public.flaky_tests (
  test_id text PRIMARY KEY,
  test_name text NOT NULL,
  suite text NOT NULL,
  team text NOT NULL,
  owner text NOT NULL,
  framework text NOT NULL,
  file_path text NOT NULL,
  flake_score int NOT NULL DEFAULT 0,
  confidence int NOT NULL DEFAULT 0,
  failure_count int NOT NULL DEFAULT 0,
  total_runs int NOT NULL DEFAULT 0,
  last_flagged_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  category text NOT NULL DEFAULT 'unknown',
  score_trend int[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.test_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id text NOT NULL REFERENCES public.flaky_tests(test_id) ON DELETE CASCADE,
  run_id text NOT NULL,
  ran_at timestamptz NOT NULL,
  status text NOT NULL,
  duration_ms int NOT NULL,
  environment text NOT NULL,
  retry_count int NOT NULL DEFAULT 0,
  ci_link text NOT NULL
);
CREATE INDEX test_runs_test_id_idx ON public.test_runs(test_id, ran_at DESC);
CREATE TABLE public.flake_trend (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_label text NOT NULL,
  flaky int NOT NULL,
  quarantined int NOT NULL,
  ordinal int NOT NULL
);
CREATE TABLE public.category_breakdown (
  category text PRIMARY KEY,
  value int NOT NULL
);
CREATE TABLE public.summary_metrics (
  id int PRIMARY KEY,
  tests_tracked int NOT NULL,
  flaky_detected int NOT NULL,
  flaky_pct numeric NOT NULL,
  quarantined int NOT NULL,
  triage_hours_saved numeric NOT NULL
);
CREATE TABLE public.model_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text NOT NULL,
  importance numeric NOT NULL,
  description text NOT NULL,
  ordinal int NOT NULL
);
CREATE TABLE public.model_metrics (
  id int PRIMARY KEY,
  precision numeric NOT NULL,
  recall numeric NOT NULL,
  f1 numeric NOT NULL,
  tp int NOT NULL, fp int NOT NULL, fn int NOT NULL, tn int NOT NULL,
  last_trained timestamptz NOT NULL,
  version text NOT NULL,
  quarantine_threshold int NOT NULL DEFAULT 85
);
CREATE TABLE public.retrain_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  trained_on date NOT NULL,
  f1 numeric NOT NULL,
  note text NOT NULL
);
CREATE TABLE public.feedback_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name text NOT NULL,
  predicted text NOT NULL,
  corrected text NOT NULL,
  submitted_by text NOT NULL,
  submitted_on date NOT NULL DEFAULT current_date
);
CREATE TABLE public.failure_clusters (
  cluster_id text PRIMARY KEY,
  representative_error text NOT NULL,
  affected_tests text[] NOT NULL DEFAULT '{}',
  occurrences int NOT NULL DEFAULT 0,
  first_seen date NOT NULL,
  last_seen date NOT NULL,
  suggested_root_cause text NOT NULL,
  category text NOT NULL DEFAULT 'unknown'
);
CREATE TABLE public.app_settings (
  id int PRIMARY KEY,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.flaky_tests, public.test_runs, public.flake_trend, public.category_breakdown, public.summary_metrics, public.model_features, public.model_metrics, public.retrain_log, public.feedback_queue, public.failure_clusters, public.app_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.flaky_tests, public.feedback_queue, public.model_metrics, public.app_settings TO anon, authenticated;
GRANT ALL ON public.flaky_tests, public.test_runs, public.flake_trend, public.category_breakdown, public.summary_metrics, public.model_features, public.model_metrics, public.retrain_log, public.feedback_queue, public.failure_clusters, public.app_settings TO service_role;

ALTER TABLE public.flaky_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flake_trend ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summary_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retrain_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failure_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read flaky_tests" ON public.flaky_tests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read test_runs" ON public.test_runs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read flake_trend" ON public.flake_trend FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read category_breakdown" ON public.category_breakdown FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read summary_metrics" ON public.summary_metrics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read model_features" ON public.model_features FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read model_metrics" ON public.model_metrics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read retrain_log" ON public.retrain_log FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read feedback_queue" ON public.feedback_queue FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read failure_clusters" ON public.failure_clusters FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read app_settings" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "demo update flaky_tests" ON public.flaky_tests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo insert feedback" ON public.feedback_queue FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "demo update model_metrics" ON public.model_metrics FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo write app_settings" ON public.app_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.app_settings (id, settings) VALUES (1, '{"githubEnabled":true,"jenkinsEnabled":false,"gitlabEnabled":false,"githubWebhook":"https://ci.example.com/hooks/github","jenkinsWebhook":"https://ci.example.com/hooks/jenkins","gitlabWebhook":"https://ci.example.com/hooks/gitlab","slackEnabled":true,"emailEnabled":false,"slackChannel":"#flaky-alerts","notifyEmail":"qa-oncall@example.com","autoQuarantine":true,"quarantineThreshold":85}'::jsonb);

INSERT INTO public.flaky_tests (test_id,test_name,suite,team,owner,framework,file_path,flake_score,confidence,failure_count,total_runs,last_flagged_at,status,category,score_trend) VALUES
('checkout-applyCoupon','checkout.applyCoupon','payments','Payments','payments-oncall','Playwright','tests/payments/applyCoupon.spec.ts',96,77,21,959,'2026-08-29T00:00:00.000Z','active','timing',ARRAY[78,100,100,87,100,100,100,100,100,93,100,92,98,100]::int[]),
('auth-sessionRefresh','auth.sessionRefresh','identity','Identity','identity-oncall','Playwright','tests/identity/sessionRefresh.spec.ts',88,97,21,704,'2026-08-27T20:42:16.407Z','quarantined','environment',ARRAY[72,97,100,74,78,98,90,94,93,100,86,95,100,100]::int[]),
('search-facetPaging','search.facetPaging','catalog','Discovery','discovery-oncall','Karate','tests/catalog/facetPaging.spec.ts',83,92,17,346,'2026-08-26T01:32:38.056Z','active','timing',ARRAY[67,86,88,87,77,74,96,77,79,93,96,100,81,100]::int[]),
('media-videoTranscode','media.videoTranscode','uploads','Media','media-oncall','Playwright','tests/uploads/videoTranscode.spec.ts',84,94,20,890,'2026-08-27T11:59:33.886Z','active','real_defect',ARRAY[90,75,69,70,97,93,86,87,82,84,84,85,81,92]::int[]),
('billing-recurringCharge','billing.recurringCharge','payments','Payments','payments-oncall','Karate','tests/payments/recurringCharge.spec.ts',75,95,18,268,'2026-08-23T02:59:39.730Z','quarantined','test_data',ARRAY[72,77,81,71,88,87,69,81,73,75,82,92,91,75]::int[]),
('notify-emailTemplate','notify.emailTemplate','comms','Growth','growth-oncall','Jest','tests/comms/emailTemplate.spec.ts',73,87,17,424,'2026-08-23T00:24:43.180Z','active','test_data',ARRAY[82,72,64,66,75,66,63,68,87,90,68,70,76,87]::int[]),
('webhooks-signatureVerify','webhooks.signatureVerify','integrations','Platform','platform-oncall','Karate','tests/integrations/signatureVerify.spec.ts',69,77,17,783,'2026-08-21T03:53:48.329Z','resolved','environment',ARRAY[78,59,65,79,84,77,86,84,69,65,75,81,89,66]::int[]),
('geo-latencyProbe','geo.latencyProbe','edge','Infra','infra-oncall','Playwright','tests/edge/latencyProbe.spec.ts',65,93,15,246,'2026-08-19T16:08:33.685Z','active','environment',ARRAY[52,76,59,58,59,79,76,73,72,81,63,71,76,75]::int[]),
('cache-warmupOrder','cache.warmupOrder','infra','Infra','infra-oncall','Jest','tests/infra/warmupOrder.spec.ts',63,75,12,971,'2026-08-21T04:12:29.173Z','quarantined','timing',ARRAY[46,51,71,59,67,51,65,81,56,59,59,85,61,76]::int[]),
('audit-logRetention','audit.logRetention','compliance','Platform','platform-oncall','Karate','tests/compliance/logRetention.spec.ts',62,79,14,1050,'2026-08-24T16:05:23.450Z','resolved','unknown',ARRAY[71,54,57,55,76,78,75,71,59,74,74,81,70,81]::int[]),
('cart-syncInventory','cart.syncInventory','cart','Commerce','commerce-oncall','Playwright','tests/cart/syncInventory.spec.ts',54,89,10,203,'2026-08-16T15:19:57.605Z','active','timing',ARRAY[48,58,39,55,64,55,63,56,64,60,53,62,54,49]::int[]),
('reco-rankBoost','reco.rankBoost','ml','ML','ml-oncall','Jest','tests/ml/rankBoost.spec.ts',55,74,10,295,'2026-08-24T21:40:53.822Z','active','unknown',ARRAY[61,64,44,55,48,48,51,72,60,73,57,77,76,65]::int[]),
('profile-avatarUpload','profile.avatarUpload','identity','Identity','identity-oncall','Playwright','tests/identity/avatarUpload.spec.ts',50,95,11,875,'2026-08-21T22:30:17.285Z','active','environment',ARRAY[40,33,49,62,54,64,49,59,56,68,65,50,58,60]::int[]),
('orders-refundFlow','orders.refundFlow','payments','Payments','payments-oncall','Karate','tests/payments/refundFlow.spec.ts',44,97,8,587,'2026-08-14T20:33:22.953Z','active','real_defect',ARRAY[32,51,53,35,53,40,55,38,64,38,54,50,42,55]::int[]),
('shipping-rateQuote','shipping.rateQuote','logistics','Commerce','commerce-oncall','Jest','tests/logistics/rateQuote.spec.ts',44,73,10,681,'2026-08-24T05:06:21.893Z','resolved','timing',ARRAY[35,29,34,29,31,34,38,36,40,36,53,65,58,59]::int[]),
('admin-bulkImport','admin.bulkImport','backoffice','Platform','platform-oncall','Playwright','tests/backoffice/bulkImport.spec.ts',35,75,10,618,'2026-08-08T18:43:09.454Z','active','test_data',ARRAY[23,34,35,29,51,36,41,30,48,52,57,40,44,46]::int[]),
('feed-infiniteScroll','feed.infiniteScroll','catalog','Discovery','discovery-oncall','Playwright','tests/catalog/infiniteScroll.spec.ts',31,92,5,896,'2026-08-05T15:55:11.972Z','active','timing',ARRAY[37,16,32,34,24,37,30,25,28,34,28,50,45,39]::int[]),
('i18n-currencyFormat','i18n.currencyFormat','catalog','Growth','growth-oncall','Jest','tests/catalog/currencyFormat.spec.ts',33,84,5,375,'2026-08-24T05:12:30.908Z','resolved','unknown',ARRAY[22,43,31,37,45,47,40,48,41,26,41,37,49,30]::int[]);

INSERT INTO public.test_runs (test_id, run_id, ran_at, status, duration_ms, environment, retry_count, ci_link)
SELECT t.test_id,
  '#' || (48210 - i)::text,
  timestamptz '2026-08-29 00:00:00+00' - (i * interval '4100 seconds'),
  CASE WHEN r > 0.62 THEN 'fail' WHEN r < 0.06 THEN 'skip' ELSE 'pass' END,
  round(1800 + r * 9000)::int,
  (ARRAY['ci-linux','staging','prod-canary','ci-macos'])[(i % 4) + 1],
  CASE WHEN r > 0.62 THEN 1 + round(r * 2)::int ELSE 0 END,
  'https://ci.example.com/builds/' || (48210 - i)::text
FROM public.flaky_tests t
CROSS JOIN generate_series(0, 23) AS i
CROSS JOIN LATERAL (SELECT (abs(hashtext(t.test_id || ':' || i)) % 1000) / 1000.0 AS r) s;

INSERT INTO public.flake_trend (day_label,flaky,quarantined,ordinal) VALUES
('07-31',18,5,0),('08-01',25,5,1),('08-02',28,6,2),('08-03',21,6,3),('08-04',29,5,4),('08-05',28,7,5),('08-06',29,7,6),('08-07',30,8,7),('08-08',28,9,8),('08-09',25,8,9),('08-10',31,10,10),('08-11',25,10,11),('08-12',27,7,12),('08-13',31,9,13),('08-14',26,8,14),('08-15',34,8,15),('08-16',36,9,16),('08-17',28,11,17),('08-18',29,11,18),('08-19',35,9,19),('08-20',33,12,20),('08-21',35,11,21),('08-22',34,10,22),('08-23',38,10,23),('08-24',33,11,24),('08-25',36,10,25),('08-26',38,10,26),('08-27',40,11,27),('08-28',34,13,28),('08-29',40,14,29);

INSERT INTO public.category_breakdown (category,value) VALUES
('timing',74),('environment',58),('real_defect',38),('test_data',27),('unknown',15);

INSERT INTO public.summary_metrics (id,tests_tracked,flaky_detected,flaky_pct,quarantined,triage_hours_saved) VALUES (1,12480,212,1.7,38,68.4);

INSERT INTO public.model_features (feature_name,importance,description,ordinal) VALUES
('historical flip-rate',0.28,'Pass/fail alternation across consecutive runs on the same commit',0),('execution time variance',0.21,'Std-dev of duration relative to suite median',1),('retry recovery rate',0.17,'Share of failures that pass on first retry',2),('environment skew',0.13,'Failures concentrated in a subset of environments',3),('parallel run correlation',0.11,'Failure rate vs. concurrent worker count',4),('assertion diversity',0.06,'Number of distinct failing assertions',5),('code churn proximity',0.04,'Recency of edits to files under test',6);

INSERT INTO public.model_metrics (id,precision,recall,f1,tp,fp,fn,tn,last_trained,version,quarantine_threshold) VALUES (1,0.91,0.86,0.884,186,18,30,1204,'2026-08-27T04:12:00Z','flake-clf v2.4.1',85);

INSERT INTO public.retrain_log (version,trained_on,f1,note) VALUES
('v2.4.1','2026-08-27',0.884,'Added retry-recovery feature'),('v2.3.0','2026-08-06',0.861,'Rebalanced timing class weights'),('v2.2.2','2026-07-18',0.842,'Human feedback batch (142 labels)'),('v2.1.0','2026-06-30',0.817,'Initial parallel-run correlation signal');

INSERT INTO public.feedback_queue (test_name,predicted,corrected,submitted_by,submitted_on) VALUES
('orders.refundFlow','timing','real_defect','m.okafor','2026-08-28'),('geo.latencyProbe','real_defect','environment','s.ravel','2026-08-27'),('reco.rankBoost','unknown','test_data','d.iyer','2026-08-25');

INSERT INTO public.failure_clusters (cluster_id,representative_error,affected_tests,occurrences,first_seen,last_seen,suggested_root_cause,category) VALUES
('clu-401','TimeoutError: locator.click: Timeout 30000ms exceeded waiting for [data-test=submit]',ARRAY['checkout.applyCoupon','cart.syncInventory','feed.infiniteScroll']::text[],148,'2026-07-14','2026-08-29','Submit button re-mounts after a late pricing fetch; click lands on a detached node.','timing'),
('clu-388','ECONNRESET: socket hang up (staging-eu-2)',ARRAY['auth.sessionRefresh','geo.latencyProbe','profile.avatarUpload']::text[],96,'2026-06-28','2026-08-28','Shared staging gateway drops idle keep-alive connections after 60s.','environment'),
('clu-372','AssertionError: expected balance 0.00 to equal 120.50',ARRAY['billing.recurringCharge','orders.refundFlow']::text[],61,'2026-07-02','2026-08-26','Fixture seed reused across parallel workers; ledger rows leak between runs.','test_data'),
('clu-355','500 Internal Server Error POST /api/v1/transcode',ARRAY['media.videoTranscode']::text[],34,'2026-08-11','2026-08-29','Genuine regression in transcode worker after ffmpeg bump — not flaky.','real_defect');