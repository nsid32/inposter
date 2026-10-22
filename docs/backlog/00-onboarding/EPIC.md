---
phase: "1"
depends_on: []
---
# 00 — Onboarding & Setup Confidence

## Why this epic exists

Goal G5 promises "A newcomer can set it up alone." Today, self-hosting professionals can install InPoster and create accounts with Anthropic and Make.com, but they hit a frustration: if they misconfigure Make.com, the error only appears when they try to publish their first post—after they've spent time writing and approving it. They have to guess what went wrong and fix it blind. This epic brings setup validation earlier and makes the user's path to "first published post" clear and forgiving.

The owner's use case (posting regularly) is working; this epic serves the second persona and unblocks the next milestone.

## What done looks like

- [ ] A user visiting for the first time sees clearly what is required, what is optional, and what is already set up.
- [ ] All three required keys (Anthropic, Make.com address, Make.com scenario) can be tested before the user writes anything.
- [ ] A user who misconfigures Make.com learns about it in Settings, not when publishing.
- [ ] A newcomer can follow a checklist or guide from Settings to "first published post" in one session.
- [ ] Error messages in Settings tell the user what went wrong and what to do next.

## Key decisions

- **D-02, D-05, D-06:** Setup assumes local-first, no sign-in, bring-your-own-key architecture. This epic works within those bounds.
- **D-07:** The three required keys are Anthropic (for text generation), Make.com address (to receive posts), and optionally Make.com API key (if the scenario needs authentication). OpenAI and Unsplash are optional and enable extra features.

## Tickets

### 0001 — Setup status indicator

**Size:** M · **Type:** functional · **Depends on:** none

The Settings page currently has fields for all keys but no overview. A newcomer can't tell which are required, which are optional, whether they are configured, or whether they are working. This ticket adds a status card at the top of Settings that shows:

- **Required:** Anthropic key (present, present & working, or missing & blocking)
- **Required:** Make.com address (present, reachable, or missing & blocking)
- **Optional but recommended:** OpenAI key, Unsplash key
- **Overall setup status:** "Ready to compose" vs. "1 thing missing" vs. "blocked"
- Each entry shows last-tested date if applicable

### 0002 — Webhook validation: test early and report clearly

**Size:** M · **Type:** functional · **Depends on:** 0001

Make.com webhooks are already tested with the "Test Webhook" button, but only when the user manually clicks it. This ticket makes webhook testing automatic and gives clearer error messages:

- Test the webhook every time it is saved or loaded
- Show detailed error messages: "Hostname not found", "Connection refused", "Server error 500", "Not a JSON API"
- Link from each error to a make.com setup guide or troubleshooting
- Cache the test result with a timestamp; re-test on page reload or after the user changes the URL

### 0003 — First-time user checklist

**Size:** M · **Type:** functional · **Depends on:** 0001, 0002

A user visiting Settings for the first time sees a checklist: "To post your first article, you'll need..."

- [ ] Anthropic API key (add yours)
- [ ] Make.com webhook address (add yours)
- [ ] (Optional) OpenAI key for image generation
- [ ] (Optional) Unsplash key for stock photos

Each checkbox shows green if configured and working, amber if configured but not tested, red if missing. The user can click through to add each one. When all required items are checked green, the checklist says "You're ready—go to Compose to write your first post."

### 0004 — Settings onboarding: link to guides and help

**Size:** S · **Type:** functional · **Depends on:** 0001

Each setting field or section has a link or tooltip explaining what it is and how to get the value. For Make.com, the link points to the README's Make.com guide or to a new in-app guide. For Anthropic, it points to the Anthropic API docs. The goal: no user should get stuck asking "Where do I find this?"

### 0005 — First publish confirmation and recovery

**Size:** L · **Type:** functional · **Depends on:** 0002

Before publishing, the user sees a final confirmation dialog that says "Your post will be sent to Make.com at [URL]." If Make.com is not reachable, the dialog shows a warning and offers to let the user test the connection or go back to Settings. After publish, if it fails, the error message includes a link to troubleshooting (e.g., "Make.com error 401: check your API key").

## Not in this epic

| Not here | Where it goes |
|---|---|
| Hosting InPoster or allowing sign-in | Non-goal; out of scope (D-02) |
| Direct LinkedIn connection or post sync | Non-goal; removed in F0018 (D-06) |
| Making "Inspire Me" smarter or saving ideas | Later epic (G2) |
| Improving post generation quality | Later epic (G1) |

## Sequencing

1. Start with 0001 (setup status): foundation for the user to see the picture
2. Move to 0002 (webhook validation): fixes the core pain point
3. Do 0003 and 0004 (checklist and guides): help the user get to ready
4. Finish with 0005 (first publish): smooth the final step

## Risks

- **Schema changes:** Adding a "last tested" timestamp for webhook validation may require a migration. Mitigate by storing the timestamp in a setting key rather than the schema, or keep it in-memory during the session.
- **Make.com flakiness:** Webhook tests may fail due to Make.com downtime, not misconfiguration. Show this clearly: "Could not reach Make.com right now; try again in a moment."
- **Overwhelming new users:** Checklist must be visual and short, not a wall of text.

## Open questions

- Should the checklist appear on every Settings visit, or only the first time? (Recommend: always, but collapsible after first visit)
- Should the status indicator also show for the optional keys (OpenAI, Unsplash)? (Recommend: yes, but visually distinct)
- Who owns the Make.com guide linked from the app—the README or a new help section? (Recommend: keep it in the README, link from the app)
