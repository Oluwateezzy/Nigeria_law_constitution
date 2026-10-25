# Hosted explanation proxy

`POST /functions/v1/ai` answers a provision question. The body matches architecture §6.2: `kind`, `installId`, `sectionId`, and `messages`. The function loads the section from `packages/content` and ignores any passage text in the body.

The hosted vendor is OpenAI, model `gpt-4.1-mini`. It returns a JSON object with `explanation`, `illustration`, `limits`, and `citations`. The model id can be swapped inside this function without changing the Ask screen.

`HOSTED_MODEL_KEY` lives in the function secrets for the same Supabase project. It is not an app env value.

Set a hard monthly spend cap on the OpenAI project before the key is used. The cap is on the vendor account. This function does not raise it.

Completed requests update `quota_usage` for the install, the signed-in user, and a hash of the caller address. `quota_folds` records that an install was folded into a user for that Lagos day. Apply `supabase/migrations/20261025190000_quota_ip.sql` before the first hosted request so those writes succeed. The service role does the writes. The client does not.

Anonymous callers are allowed. `verify_jwt` is off for this function. Quota and citation checks run in `packages/domain`.

The lane comes from `entitlements`. A missing or expired row is the free lane, 5 per Lagos day. An active Plus row is 100. A `plus` or `lane` field on the request does not change that. Store purchases are written by the RevenueCat webhook, and web purchases by the Stripe webhook. Own-key requests never call this function.

Logs from `completeHostedProvision` keep status, token count, kind, content version, and a hash of the install id. They do not keep the question, the prompt, the section text, or the model output.

A real staging run of `packages/content/eval/provision.json` needs `HOSTED_MODEL_KEY` in the function secrets. Until that key is set, CI runs the scripted provider only.
