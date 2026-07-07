# Public Feedback Chain Plan

Status: Active Project 01 public feedback strategy.

## Purpose

This plan defines where the first OrgAnchor Project 01 public video should be published and why.

The goal is not maximum traffic. The goal is high-quality public feedback that can be traced, summarized, turned into issues, and used to improve Fireseed Alpha.

OrgAnchor is Project 01 under CivitasX. Use this plan only after the CivitasX
parent-channel context exists, so viewers understand why an OrgAnchor video
appears on a CivitasX channel.

## First-Wave Platform Roles

Use this first-wave matrix:

```text
YouTube   -> canonical video host and long-lived public video URL.
GitHub    -> executable review, issues, reproduction, roadmap changes.
Bluesky   -> first discussion chain and open-protocol audience.
LinkedIn  -> professional audience: supply chain, AI, open infrastructure, sponsors.
X         -> mirror distribution for AI/open-source/Web3 technical audiences.
```

## Why Bluesky Is First Wave

Bluesky is not only another social platform for this project.

It is relevant because:

```text
it has public reply and repost chains suitable for critique;
it is built around AT Protocol and custom feeds;
it supports domain-based handles, which matches OrgAnchor's verifiable-presence theme;
its audience includes people interested in open protocols, non-monopoly social infrastructure, AI, identity, and moderation/labeling systems;
it is useful for testing whether OrgAnchor's message works outside traditional centralized recommendation channels.
```

Bluesky should be treated as:

```text
the first public conversation layer;
not the canonical artifact store;
not the source of truth;
not a replacement for GitHub issues.
```

## Recommended Publishing Order

Use this order:

```text
1. Publish or pin the CivitasX parent-channel overview.
2. Publish the reframed OrgAnchor Project 01 video on YouTube.
3. Open or update the Fireseed Wave 1 GitHub issue with the YouTube URL.
4. Publish the Bluesky thread, linking to YouTube, GitHub, and organchor.org/verify.
5. Publish the LinkedIn post with a professional framing.
6. Publish the X thread as a mirror distribution channel.
7. Record all URLs in a release note or tracking issue.
```

## Account Requirements

The human owner must provide or create:

```text
YouTube channel access;
GitHub organization access;
Bluesky account access;
LinkedIn profile or organization page access;
optional X account access.
```

Preferred Bluesky setup:

```text
create a normal Bluesky account first;
set a custom domain handle after account creation;
prefer @organchor.org if available;
otherwise use a subdomain handle such as @bsky.organchor.org;
keep the handle tied to OrgAnchor's domain to avoid a weak official-looking account name.
```

Bluesky's official guidance says custom domain handles are set after creating the account, and the app provides the DNS verification record to add. Do not guess the DNS record manually before the account UI provides it.

## Feedback Capture

After the first wave is posted, collect feedback into these buckets:

```text
positioning confusion;
trust-boundary misunderstanding;
technical reproduction issue;
evidence-layer criticism;
AI-agent integration question;
Directory/discovery concern;
commercial-fit concern;
platform/account/publication issue.
```

Every useful public comment should be converted into one of:

```text
GitHub issue;
documentation patch;
roadmap note;
known gap;
rejected non-goal with reason.
```

## Hold Or Adjust Criteria

Pause wider distribution if:

```text
many readers understand OrgAnchor as a certification authority;
many readers think PASS means "good organization";
the self-pilot verify page becomes unavailable;
the GitHub repo or package install path fails;
the Bluesky thread attracts serious unresolved boundary criticism;
the video title or thumbnail causes misleading expectations.
```

## Official References

- Bluesky custom domain handles: `https://blueskyweb.zendesk.com/hc/en-us/articles/19001802873101-How-to-Set-your-Domain-as-your-Handle`
- Bluesky suggested handle flow: `https://blueskyweb.zendesk.com/hc/en-us/articles/44878051792269-What-is-the-suggested-user-handle-format`
- Bluesky custom feeds: `https://docs.bsky.app/docs/starter-templates/custom-feeds`
- Bluesky post/thread API model: `https://docs.bsky.app/docs/tutorials/creating-a-post`
