---
epic: 00-onboarding
type: functional
quality: []
status: Not started
size: M
depends_on: []
---
# 0001 — Setup status indicator

## Why

A newcomer opening Settings for the first time sees a form with fields for five API keys and a webhook URL, with no indication of which are required, which they have already configured, or whether the ones they entered actually work. This blocks the path to first post: they do not know if they are ready to start writing or if they need to fix something first. They may start writing, then hit an error at publish time when it is too late to go back.

A clear status view at the top of Settings answers the question: "Am I set up?"—and if not, what is blocking me? 

## Scope

**In:**

- Add a "Setup status" section at the top of the Settings page, above all other fields
- Show three rows: Anthropic key, Make.com address, Make.com webhook API key
- Label Anthropic and Make.com address as **Required**; webhook API key as **Optional**
- Each row shows one of three states:
  - Green checkmark + "Configured" if the setting is present (for URLs, if non-empty; for keys, if non-empty)
  - Yellow icon + "Configured but not tested" if present but never tested
  - Red ✕ + "Missing" if empty
  - Green checkmark + "Configured and working" after a successful test (if last test passed within the current session or stored test result shows recent success)
- Add a "Get started" visual guide: "To post, you need these three things" with a brief sentence for each
- Show overall status: "🟢 Ready to compose" if Anthropic and Make.com address are present, "🟡 Almost there" if one is missing, "🔴 Not ready" if both are missing or any required key has a stored error
- Each status row has a button "Add", "Test", or "Fix" appropriate to its state

**Out:**

- Do not add a new database column for test timestamps; store the result in a React state during the session or as a new settings key `last_anthropic_test` and `last_webhook_test`
- Do not trigger automatic testing on page load (0002 will add this); just show the current state
- Do not test OpenAI or Unsplash keys in this ticket—those are optional and handled separately (0004)
- Do not redesign the rest of the Settings form; this ticket adds only the status section

## Data model

No schema changes. Testing results are stored as new plain-text settings keys (created by 0002 if needed):

- `last_anthropic_test`: ISO 8601 timestamp of last successful test, or empty
- `last_webhook_test`: ISO 8601 timestamp of last successful test, or empty
- `last_anthropic_error`: error message from the last failed test, or empty
- `last_webhook_error`: error message from the last failed test, or empty

## API surface

No new routes. Uses existing:

- `GET /api/settings` — fetches current settings and stored test results
- `PUT /api/settings` — stores test result timestamps
- `POST /api/settings/test-ai` — tests Anthropic (called by user clicking "Test")
- `POST /api/settings/test-webhook` — tests Make.com webhook (called by user clicking "Test")

## UX notes

**Layout of the status card:**

```
┌─ Setup Status ───────────────────────────────────┐
│                                                  │
│ To post, you need these three things:            │
│                                                  │
│ ✓ Anthropic API key (Required)                  │
│   Configured and working · tested 2 min ago     │
│                                [Test] [Change]  │
│                                                  │
│ ⚠ Make.com address (Required)                   │
│   Configured but not tested                     │
│                                [Test] [Add]     │
│                                                  │
│ ○ Make.com API key (Optional, for auth)         │
│   Not configured                                │
│                                          [Add]  │
│                                                  │
│ ┌─ Overall: 🟡 Almost ready ─────────────────┐ │
│ │ Add your Make.com address to get started.  │ │
│ │ [Go to Make.com section ↓]                │ │
│ └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**States and copy:**

| State | Icon | Copy | Buttons |
|---|---|---|---|
| Configured, last tested recently | ✓ (green) | "Configured and working · tested 2 min ago" | [Test] [Change] |
| Configured, not tested | ⚠ (amber) | "Configured but not tested" | [Test] [Change] |
| Configured, last test failed | ✕ (red) | "Configured but not working (Error: ...)" | [Test] [Change] |
| Not configured | ○ (gray) | "Not configured" | [Add] |

**Button behavior:**

- [Test]: calls `POST /api/settings/test-ai` or `/api/settings/test-webhook`, shows result, updates the row
- [Add]: scrolls to the relevant input field in the form below and focuses it
- [Change]: same as [Add], focuses the field
- If a test is in progress, the button shows a spinner

**Overall status message:**

- "🟢 Ready to compose" if Anthropic key and Make.com address are both configured and last test passed
- "🟡 Almost ready" if either is missing or not tested
- "🔴 Not ready" if both are missing or the last test on either failed

Below the status, show a single actionable sentence:
- "Add Anthropic key to get started."
- "Test your Make.com address—it may not be reachable."
- "All set! Go to Compose to write your first post."

## Acceptance criteria

- [ ] Settings page shows a "Setup status" card at the top, before all other form sections (test: visual inspection on Settings page, screenshot)
- [ ] The status card displays the three rows (Anthropic key, Make.com address, API key) with correct icons (✓, ⚠, ✕, ○) and state-appropriate copy (test: manual click through each state, verify copy matches the table above)
- [ ] [Test] button calls the appropriate test endpoint and shows the result (Anthropic or webhook) without leaving the page (test: `0001.test.ts` — click [Test] on each row, verify fetch to correct endpoint, verify UI updates)
- [ ] [Add] and [Change] buttons scroll to and focus the relevant input field (test: `0001.test.ts` — click button, verify window.scrollIntoView or smooth scroll behavior, verify input receives focus)
- [ ] Overall status shows green/amber/red as described and displays the correct one-line message (test: `0001.test.ts` — set settings to different combinations, verify status icon and message match the rules)
- [ ] Test results (timestamp and error) are stored and persist across Settings page reloads within the session (test: `0001.test.ts` — test, reload page, verify result still shows)
- [ ] The layout fits on desktop (1024px+) and mobile (375px+) without breaking (test: visual inspection at breakpoints)
- [ ] Clicking [Change] for a key field clears the mask and allows editing; saving the field updates the setting (test: `0001.test.ts` — click [Change] on Anthropic key, edit, save, verify fetch to `PUT /api/settings`)

## Test cases

| Case | Setup | Action | Expected |
|---|---|---|---|
| First visit, no keys | All empty | Load Settings | Status shows "🔴 Not ready" with message "Add Anthropic key to get started." |
| Anthropic only | `anthropic_api_key` set | Load Settings | Status shows "🟡 Almost ready" with message "Add your Make.com address." |
| Both required keys, not tested | Both set, but no test yet | Load Settings | Status shows "🟡 Almost ready" with message "Test your Make.com address to confirm it works." |
| Both required keys, Anthropic passes | Both set; `last_anthropic_test` recent | Load Settings | Anthropic row shows ✓ "Configured and working"; Make.com row shows ⚠ "Not tested" |
| Both required keys, webhook fails | Both set; `last_webhook_error` set | Load Settings | Make.com row shows ✕ "Configured but not working (Error: Connection refused)" |
| User clicks [Test] on webhook | Webhook URL set, not tested | Click [Test] button | Button shows spinner, fetches `/api/settings/test-webhook`, updates row to show result |
| User clicks [Add] on Anthropic | Anthropic field empty | Click [Add] button | Scrolls to Anthropic field, focuses it, shows cursor |
| User edits Anthropic and saves | Anthropic field has old key | Clear field, enter new key, save | Settings POST succeeds, status updates if auto-testing (0002) is done; for now, clears cached test result |

## Gotchas

- **Masked keys:** The GET endpoint returns sensitive keys as `"••••••••••••"`. The UI must check if the value is masked; if it is, treat it as "configured" (not empty) but "not editable without re-entering".
- **Test results as settings:** Storing test timestamps and errors as settings keys means they appear in the settings table. Later, when a proper audit log is built, these may need to be hidden. For now, prefix them with `_` to signal they are internal: `_last_anthropic_test`, `_last_webhook_test`, etc.
- **Race conditions:** If the user clicks [Test] twice quickly, two requests fire. The second may return before the first. Use a loading flag to prevent double-submission.
- **Session-only or persistent?** The EPIC says "Re-test on page reload or after user changes the URL." This means test results should be lost on page reload (session state) but also checked if settings have a stored `_last_anthropic_test` key (persistent, if 0002 has stored it). For now, display the persistent result if it exists; 0002 will add automatic re-testing.

## Open questions

- Should the status card collapse after first view? (Defer to product review; recommend: always visible for quick reference)
- If the user has not entered any keys yet (brand new), should we show a welcome message instead of three empty rows? (Defer to 0003, which adds a checklist; for now, show the rows)
- Should test results include the full error message, or a shortened version with a "Details" button? (Recommend: summary line + optional details, to keep the UI clean)
