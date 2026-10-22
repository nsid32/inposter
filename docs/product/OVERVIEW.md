---
stage: live
summary: A personal writing assistant, run on your own computer, that helps a professional write, illustrate, approve and publish LinkedIn posts.
---
# InPoster

*As of 2026-10-21.* Nobody answered the product questions when this backlog was started, so
everything here is **inferred** from what the product does today, its
[public project page](https://github.com/nsid32/inposter), its
[change history](https://github.com/nsid32/inposter/blob/main/CHANGELOG.md) and the earlier
feature notes kept on the owner's machine. The owner should confirm or correct each section.

## In one paragraph

InPoster is a writing assistant for LinkedIn that a person runs on their own computer. They
describe what they want to say, and Claude (Anthropic's AI) writes two versions of the post in the
tone and length they chose. They pick one, edit it, add a picture (their own, one made by AI, or a
free stock photo from Unsplash), approve it, and publish it to their LinkedIn profile with one
click through their own Make.com scenario. Everything they write stays on their computer; the only
things that leave it are the requests they trigger to the services they connected. *(Inferred.)*

## The problem

*(Inferred.)* Posting regularly on LinkedIn takes time: finding something to say, writing it in a
voice that works on LinkedIn, finding a picture, and remembering what was already posted. General
AI chat tools help with the words but not with the rest, and LinkedIn-specific tools are hosted
services that hold your drafts and your account on their side. Connecting directly to LinkedIn is
also hard for an individual: the earlier feature notes record that a direct connection was built,
then removed because LinkedIn restricts the access it needs to a separate, approved app.

## The idea

*(Inferred.)* Keep the whole writing workflow in one small app that runs on the user's own
computer, uses the user's own AI accounts, and hands the finished post to a Make.com scenario that
the user owns and that posts to LinkedIn for them. No sign-up, no subscription, no data held by
InPoster's makers. It is open source, so anyone can set it up from the
[public project page](https://github.com/nsid32/inposter).

## Who it is for

*(Inferred.)* First, the owner: a professional who posts on LinkedIn and built InPoster for their
own use. Second, people like them who find it on GitHub: professionals comfortable installing a
small app and creating their own Anthropic, Make.com and optionally OpenAI and Unsplash accounts.
See [Customers](CUSTOMERS.md).

## What it promises

*(Inferred from the [public project page](https://github.com/nsid32/inposter).)*

- **Your data stays on your computer.** Posts, settings and pictures are kept on your own
  computer. Nothing is sent anywhere except the requests you trigger: to Anthropic, OpenAI,
  Unsplash and your Make.com scenario. No accounts, no tracking.
- **Your secret keys are protected.** The keys you give InPoster for other services are stored
  scrambled (encrypted) and are never shown again in full.
- **Nothing is published without your say-so.** Every post is a draft until you approve it, and
  publishing asks you to confirm.
- **Setup without editing files.** Everything is configured on the Settings page.
- **Free and open.** MIT licence; you pay only the services you connect.
