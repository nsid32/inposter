# What users can do today

*As of 2026-10-21.* What is built, in users' words: what someone can do, area by area. The map of
the code is on the technical side. Read from the product as released in version 0.4.6 (see the
[change history](https://github.com/nsid32/inposter/blob/main/CHANGELOG.md)) and the earlier
feature notes, all 34 of which are finished.

## Summary

One person, on their own computer, can ask Claude for two versions of a LinkedIn post on any
topic, get topic ideas when stuck, edit the version they like, add a picture (uploaded, made by AI,
or from Unsplash), save it as a draft, approve it, and publish it to LinkedIn through their own
Make.com scenario. They can look back at what they published on a timeline and see simple totals
on the Dashboard. Everything is set up on one Settings page, in a dark or light appearance.

## By area

### Getting started

- Install and start InPoster with two commands from its
  [public project page](https://github.com/nsid32/inposter); it opens in the browser on the
  user's own computer.
- Follow a step-by-step guide, with screenshots, to build the Make.com scenario that posts text
  posts and picture posts to LinkedIn.
- Use the app without any keys; Compose shows a notice with a link to Settings until an Anthropic
  key is added.

### Settings

- Paste the Make.com address, and an optional Make.com access key, then test it with the button
  beside **Save**: InPoster sends a sample post and says whether Make.com received it.
- Add an Anthropic access key, choose the model (Sonnet 4.6, recommended, or Haiku 4.5, faster and
  cheaper), and **Test Connection**.
- Add an OpenAI access key to turn on picture generation, and an Unsplash access key to turn on
  photo search. Buttons that need a missing key are greyed out with a hint.
- Keys are shown only as dots once saved, with an eye button to show what is being typed.
- Add up to ten areas of interest for Inspire Me.
- Set preferences: default tone, length, number of hashtags and emojis on or off.
- Choose a dark or light appearance (also from a button at the bottom of the side menu). The
  choice is remembered.
- Open a short Quick Setup Guide.

### Writing a post (Compose)

- Type a topic, and optionally key points, a target audience and a call to action.
- Choose tone, length, number of hashtags (0 to 10) and emojis; these start from the preferences.
- **Generate** (or press Cmd/Ctrl + Enter) to get two variants; **Regenerate** for two new ones.
- **Inspire Me**: get five fresh ideas based on the areas of interest, and, once the user has
  published, one or two follow-ups that continue a recent post. Picking one fills in the topic.
- Edit each variant in place, with a character counter that turns red above 1,300.
- Add one picture to a variant: upload one, generate one with DALL-E 3 (write an image prompt or
  click **Suggest** for one written from the post; preview, then use, regenerate or discard), or
  search Unsplash. Remove it with the cross.
- **Save as Draft** to send the variant, with its picture, to the Queue.

### Reviewing and publishing (Queue)

- See posts in three columns: Drafts, Approved and Published, each with a count.
- Each card shows the start of the text, the date, the tone, the character count and the picture.
- On a draft: **Edit** (opens it in Compose, picture included), **Approve**, **Discard** (hides it
  for good) or **Delete** (after confirming).
- On an approved post: **Edit** in a pop-up with a character counter, **Unapprove** (back to
  drafts), **Publish Now** (after a confirmation that shows the text) or **Delete**.
- Add a picture to a draft or approved post that has none, by upload or from Unsplash, or remove
  it.
- When publishing fails, the post stays approved and a message says why; when Make.com is not set
  up, the message says to add it in Settings.
- On a published post: see when it was published, **Resend** it to Make.com, or **Delete** it from
  InPoster.
- Choose how many days back the Published column shows (30 by default).

### Looking back (Timeline and Dashboard)

- Timeline: every published post, newest first, grouped by month, with its picture, date and time,
  and tone. Long posts show the first 100 characters with **Read more**.
- Dashboard: total posts, drafts pending, posts published in the last seven days, and the five
  most recent drafts, with shortcuts to Compose and the Queue.

### Privacy

- Posts, pictures and settings are kept on the user's computer. Access keys are stored scrambled.
- InPoster sends nothing on its own; it contacts Anthropic, OpenAI, Unsplash and the user's
  Make.com scenario only when the user does something that needs them.

## Not built yet

*(Gaps seen in the product today, or left out of earlier features. Not a plan: the owner and
product members decide what to build.)*

- Scheduling a post for later; publishing is now only.
- Seeing whether a post really appeared on LinkedIn, or a link to it there. "Published" means
  Make.com accepted it.
- Bringing back a discarded draft, or seeing discarded drafts at all. The Dashboard's total still
  counts them.
- Generating a picture with AI from the Queue (only upload and Unsplash are offered there), or
  replacing a picture without removing it first.
- Editing a published post, or removing it from LinkedIn when it is deleted in InPoster.
- Keeping the Unsplash photographer's name with the post once a photo is attached.
- Searching or filtering drafts, more than one picture per post, or more than two variants.
- How posts performed on LinkedIn (views, likes, comments).
- More than one LinkedIn profile, or any network other than LinkedIn.
