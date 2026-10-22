# What InPoster does today

*As of 2026-10-21,* read from the code by the "Read what is built" job.

## Dashboard

The home page shows totals and recent activity: how many posts exist (all time), how many drafts
are waiting to be reviewed, how many were published this week, and the 10 most recent drafts with
their dates and tone. Links lead directly to Compose (to write a new post) and Queue (to review
pending drafts).

## Compose

Where a user describes a topic and gets two ready-to-publish versions from Claude.

The page shows:
- Topic (required): what the user wants to post about
- Key points, target audience, call to action (optional): details that guide the AI
- Tone: Professional, Conversational, Inspirational or Provocative
- Length: ~300 characters (short), ~600 (medium), ~1,300 (long); a guide, not a limit
- Hashtags: 0 to 10; included in the generated post
- Emojis: on or off

Two variant cards appear with the AI's drafts. The user can:
- Edit the text
- See and edit the character count (with a warning above 1,300)
- Add, generate or search for a picture:
  - Upload from their computer (JPEG, PNG, GIF, WebP; up to 5 MB)
  - Generate with DALL-E 3 using OpenAI (requires OpenAI key in Settings)
  - Search Unsplash for a free stock photo (requires Unsplash key)
- Save the variant as a draft to the Queue

A button labeled "Inspire Me" asks Claude for five fresh post ideas based on the user's areas of
interest, plus one or two follow-ups if they have published before. Ideas can be used as topics.

The user's default tone, length, hashtag count and emoji choice (from Settings) fill the form on
first visit.

## Queue

A three-column view: Drafts (left), Approved (middle), Published (right). Posts move right as
they are approved and published.

Each post card shows the text, creation date and tone. The user can:
- Edit the text and save
- Add, change or remove a picture
- Move the post to Approved (from Draft) or Discarded
- Send the post to LinkedIn through Make.com (from Approved), with a final confirmation
- Edit a Published post (text only; moving it back to Approved)
- Delete a post (permanent; a separate, strong confirmation)
- Resend a Published post if the first send failed

## Timeline

A reverse-chronological history of published posts, grouped by month. Each post shows its text,
publication date and tone. Users can edit the text and delete if they change their mind, but
posts already sent to LinkedIn stay there (InPoster cannot remove them).

## Settings

Where the user configures everything without editing files.

**AI and images:**
- Anthropic key: required to generate posts; a "Test Connection" button verifies it works
- Claude model: Sonnet 4.6 (recommended) or Haiku 4.5 (faster, cheaper)
- OpenAI key: optional; enables image generation with DALL-E
- Unsplash key: optional; enables Unsplash search

**Preferences:**
- Default tone, length, hashtag count and emoji choice (these fill Compose on first visit)
- Areas of interest (up to ten topics): used by "Inspire Me" to suggest relevant ideas

**Publishing:**
- Make.com webhook address: where InPoster sends approved posts for LinkedIn
- Make.com API key: optional; used if Make.com's scenario needs it for authentication
- A "Test Webhook" button verifies the address is reachable

**Appearance:**
- Dark (default) or Light theme

All keys are stored encrypted on the user's computer and shown only as dots. The browser never
receives a stored key.

## What is not in the UI

InPoster does not:
- Sync existing posts from LinkedIn or show engagement (likes, comments, impressions)
- Schedule posting for a future date
- Connect to Twitter, Instagram or other social networks
- Support multiple LinkedIn profiles or teams
- Offer a mobile app or web version to access from other devices
