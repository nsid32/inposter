---
epic: 00-onboarding
type: functional
quality: []
status: Not started
size: M
depends_on: ["0001"]
---
# 0002 — Webhook validation: test early and report clearly

## Why

Today, a self-hosting professional enters their Make.com webhook URL in Settings and sees a "Test Webhook" button. If they click it, they get a basic yes/no result. If they do not click it, they have no idea whether it will work—and the only time they find out is when they try to publish their first post, after writing and approving it. The error is cryptic ("Status 404", "Connection refused") and the user has no idea what to do next.

This ticket makes webhook validation automatic and gives clear, actionable error messages in Settings so the user knows immediately if their Make.com scenario is reachable and ready, and if not, what to do.

## Scope

**In:**

- Automatically test the Make.com webhook when the user saves the webhook URL (immediately after PUT to `/api/settings`)
- Cache the test result with a timestamp; re-test on every Settings page load (0001 displays it)
- Expand error messages from generic "Connection failed" to specific diagnoses: "Cannot reach the webhook URL", "Server responded with 500 error", "The URL appears to be JSON but the body is not valid", etc.
- Store the test result and error message as settings: `_last_webhook_test` (ISO 8601 timestamp) and `_last_webhook_error` (error message or empty if success)
- Do the same for the Anthropic key test: auto-test on save, store `_last_anthropic_test` and `_last_anthropic_error`
- Show the timestamp on the status card: "tested 2 min ago" (0001 displays it)

**Out:**

- Do not add test indicators to other settings (OpenAI, Unsplash) in this ticket—those are addressed in 0004
- Do not automatically publish or re-test in the background; testing happens only on Settings page load or when the user saves a URL/key
- Do not change the POST endpoint `/api/settings/test-webhook` or `/api/settings/test-ai`; enhance them to return more detail
- Do not block the user from saving if the test fails; they can save and re-test later

## Data model

Add two new plain-text settings keys (no schema migration needed):

| Key | Type | Used for |
|---|---|---|
| `_last_anthropic_test` | text (ISO 8601 timestamp) | Timestamp of last successful Anthropic test |
| `_last_anthropic_error` | text | Error message from last failed test, or empty |
| `_last_webhook_test` | text (ISO 8601 timestamp) | Timestamp of last successful webhook test |
| `_last_webhook_error` | text | Error message from last failed test, or empty |

These are stored in the `settings` table, same as all other settings. They are prefixed with `_` to indicate they are internal/computed.

## API surface

Enhance existing endpoints; no new routes:

**`POST /api/settings/test-ai`** (currently returns `{ ok, message }`)

Enhance to return more detail on failure:

```json
{
  "ok": true,
  "message": "Anthropic API key is working"
}
```

or on failure:

```json
{
  "ok": false,
  "message": "Failed to connect to Anthropic API",
  "details": "Error: ENOTFOUND api.anthropic.com"
}
```

**`POST /api/settings/test-webhook`** (currently returns `{ ok, message }` or `{ error }`)

Enhance to diagnose the type of failure:

```json
{
  "ok": true,
  "message": "Webhook received the test payload successfully."
}
```

or on failure, include one of these types:

```json
{
  "ok": false,
  "type": "unreachable",
  "message": "Cannot reach the webhook URL at https://hook.make.com/abc123",
  "details": "Error: ENOTFOUND hook.make.com"
}
```

```json
{
  "ok": false,
  "type": "http_error",
  "message": "Server responded with status 500",
  "details": "The Make.com scenario may have an error. Check Make.com logs."
}
```

```json
{
  "ok": false,
  "type": "timeout",
  "message": "Webhook did not respond within 10 seconds",
  "details": "The scenario may be overloaded. Try again in a moment."
}
```

```json
{
  "ok": false,
  "type": "invalid_response",
  "message": "Webhook did not return valid JSON",
  "details": "Make.com should return { success: true } or { error: \"...\" }"
}
```

**`PUT /api/settings`** (unchanged endpoint, enhanced behavior)

When the user saves `make_webhook_url` or `anthropic_api_key`:
1. Save the setting immediately
2. Asynchronously test it by calling `/api/settings/test-ai` or `/api/settings/test-webhook`
3. On test result, store `_last_anthropic_test`/`_last_webhook_test` (timestamp) and `_last_anthropic_error`/`_last_webhook_error` (error message)
4. Return success immediately (do not wait for test to complete)

Example flow:

```
User enters Make.com URL and clicks Save
→ PUT /api/settings with { make_webhook_url: "https://..." }
→ Server saves the setting, returns 200 { success: true }
→ (in background) Server calls POST /api/settings/test-webhook
→ Test result is saved to `_last_webhook_test` and `_last_webhook_error`
→ Client re-fetches /api/settings on next Settings page load and sees the updated timestamp
```

## UX notes

**Error messages shown in 0001's status card:**

- "✓ Configured and working · tested 2 min ago"
- "⚠ Configured but not tested"
- "✕ Configured but not working (Error: Cannot reach the webhook URL at hook.make.com/...)"

When the user clicks [Test] on a row, show a modal or toast with the full message:

```
Make.com webhook error (status 500)
The Make.com scenario may have an error.

Check Make.com logs, or:
1. Open your scenario in Make.com
2. Run the scenario manually to see the error
3. Fix the issue and save
4. Return here and click [Test] again

[Try again] [Go to Make.com] [Close]
```

For Anthropic errors:

```
Anthropic API key not working

Error: 401 Unauthorized

Check that:
- The key is copied correctly (no extra spaces)
- The key is still valid (not revoked in Anthropic console)
- Your account has API access enabled

[Try again] [Go to Anthropic API] [Close]
```

## Acceptance criteria

- [ ] When user saves `make_webhook_url` or `anthropic_api_key` in Settings, the server tests it automatically and stores `_last_webhook_test`/`_last_anthropic_test` as the current timestamp (test: `0002.test.ts` — PUT a webhook URL, immediately GET `/api/settings`, verify the timestamp is recent and matches ISO 8601 format)
- [ ] If the test passes, `_last_webhook_error` is empty; if it fails, it contains a descriptive error message (test: `0002.test.ts` — test webhook that returns 500, verify error message contains "500")
- [ ] Test result is available on the next GET `/api/settings` call, even if the user closed the browser and came back (test: `0002.test.ts` — PUT webhook URL, server stores result, spin up new client, GET `/api/settings`, verify result is there)
- [ ] Error messages distinguish between different failure types: unreachable, HTTP error (4xx/5xx), timeout, and invalid response (test: `0002.test.ts` — mock Make.com to return each failure type, verify error messages include the type/status code)
- [ ] Anthropic test errors are also stored and include the HTTP status code and reason (test: `0002.test.ts` — mock Anthropic to return 401, verify error includes "401")
- [ ] User can click [Test] in the 0001 status card to re-test on demand, and the result updates immediately without page reload (test: `0002.test.ts` — click [Test], verify the button shows spinner, then shows updated result)
- [ ] Saving a setting returns success immediately; testing happens in the background and does not block the response (test: `0002.test.ts` — PUT webhook URL, verify response is 200 before test completes, verify result is saved after test finishes)
- [ ] Timestamps are stored in ISO 8601 format and can be parsed as dates (test: `0002.test.ts` — verify timestamp format with regex `/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}`)

## Test cases

| Case | Setup | Action | Expected |
|---|---|---|---|
| First save, webhook works | Webhook URL empty | Save `https://hook.make.com/abc123` | Returns 200; on next Settings load, status shows ✓ "Configured and working" |
| Save, webhook unreachable | Webhook URL empty | Save `https://invalid-domain-12345.com` | Returns 200; on next Settings load, shows ✕ with error "Cannot reach the webhook URL" |
| Save, webhook returns 500 | Webhook URL empty | Save Make.com URL (mock server to return 500) | Returns 200; on next Settings load, shows ✕ with error "Server responded with status 500" |
| Save, webhook times out | Webhook URL empty | Save Make.com URL (mock server to not respond within 10s) | Returns 200; on next Settings load, shows ✕ with error "Webhook did not respond within 10 seconds" |
| Re-test after fixing | Webhook was unreachable, then fixed | Click [Test] in status card | Shows spinner, fetches `/api/settings/test-webhook`, updates status to ✓ if now working |
| Anthropic key save | Anthropic key empty, invalid key provided | Save invalid key | Returns 200; on next Settings load, shows ✕ with error "401 Unauthorized" |
| Anthropic key save, valid | Anthropic key empty, valid key provided | Save valid key | Returns 200; on next Settings load, shows ✓ "Configured and working" |
| Mask behavior after save | Anthropic key saved, user clicks Test | Click [Test] on Anthropic row | Shows result from stored `_last_anthropic_test`, does not require user to re-enter key |

## Gotchas

- **Background test timing:** If the user saves and immediately navigates away, the test may still be running on the server. When they come back to Settings, they see the result. This is fine and expected. Do not block the save response waiting for the test.
- **Anthropic and OpenAI timeouts:** Anthropic API may be slow. Use a 15-20 second timeout for the test call, not the same timeout as a normal Compose request.
- **Make.com signature:** Some Make.com scenarios expect a specific header signature. The test should mimic exactly what the publish flow sends (0002 does not change publish, but confirm the test matches it).
- **IPv6 and DNS:** Some machines may have DNS issues. If a webhook URL uses a domain, test with full DNS resolution. If it is an IP address, test directly. Do not cache DNS results across tests.
- **Settings not persisted on error:** A PUT to `/api/settings` should save the value even if the test fails. The user should be able to save a URL they know is temporarily down and re-test it later.

## Open questions

- Should the user see the test happen in real time (button shows "Testing..." spinner)? Or should it be silent and only show the result on the next Settings load? (Recommend: silent; 0001 adds a manual [Test] button for immediate feedback)
- Should auto-testing retry on transient failures (network hiccup), or fail immediately? (Recommend: fail immediately; user can retry by clicking [Test])
- Should the error message in the status card be truncated to one line, with a "Details" button? Or the full message? (Recommend: one-line summary with a hover tooltip or expandable details)
