# Public Feedback Chain Plan

Status: Active OrgAnchor public feedback strategy.

## Purpose

This plan defines where the first OrgAnchor public feedback wave should be published and why.

The goal is not maximum traffic. The goal is high-quality public feedback that can be traced, summarized, turned into issues, and used to improve Fireseed Alpha.

OrgAnchor can be cross-shared through CivitasX, but its first feedback wave is independently anchored in the OrgAnchor repository, public self-pilot, official domain, and review issue. A CivitasX post or public video may add context later; neither is a prerequisite for the first validation call.

## First-Wave Platform Roles

Use this first-wave matrix:

```text
GitHub    -> canonical executable review, issues, reproduction, roadmap changes.
Bluesky   -> first discussion chain and open-protocol audience.
LinkedIn  -> professional audience: supply chain, AI, open infrastructure, sponsors.
X         -> mirror distribution for AI/open-source/Web3 technical audiences.
YouTube   -> deferred canonical video host after the video quality gate is met.
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

Use this first-wave order:

```text
1. Open the Fireseed Wave 1 GitHub issue.
2. Publish the Bluesky thread, linking to the GitHub issue, source repository, and organchor.org/verify.
3. Publish the LinkedIn post with a professional framing.
4. Publish the X thread as an optional mirror distribution channel.
5. Record all public post URLs in the GitHub tracking issue.
6. Publish the OrgAnchor video later only after the video quality gate is met.
```

## Account Requirements

The human owner must provide or create:

```text
GitHub organization access;
Bluesky account access;
LinkedIn profile or organization page access;
optional X account access.
optional YouTube channel access after the video quality gate.
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
