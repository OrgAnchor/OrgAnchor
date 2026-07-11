# OrgAnchor 90-Second Concept Video Release Pack

Status: Rendered local draft asset pack for OrgAnchor. Not approved for public upload.

## Purpose

This pack supports a future OrgAnchor public video action:

```text
Publish a 90-second OrgAnchor concept video only after the OrgAnchor video quality gate is met.
```

The video should explain the problem and direction, not sell OrgAnchor as finished infrastructure.

## Distribution Boundary

This pack remains an OrgAnchor-owned video source package. OrgAnchor does not depend on a CivitasX parent-channel launch. CivitasX may later cross-share the finished video with broader portfolio context, but that is a distribution choice rather than a release prerequisite or protocol relationship.

Do not publish the current local draft merely because the assets exist. Voice, pacing, visual hierarchy, captions, claims, and linked public verification paths must pass the separate video quality gate first.

## Generated Draft Assets

Current local draft:

```text
public-assets/video-90s/organchor-90s-fireseed-alpha.webm
```

Supporting local assets:

```text
public-assets/video-90s/organchor-90s-voice.en-US.wav
public-assets/video-90s/organchor-90s-renderer.html
public-assets/video-90s/organchor-90s.en.srt
public-assets/video-90s/organchor-90s.zh-Hans.srt
```

Generation scripts:

```text
scripts/synthesize-90s-voice.ps1
scripts/render-90s-video.mjs
```

The first draft uses local Windows speech synthesis and browser-based WebM recording. It is acceptable as an alpha launch draft, but a human-recorded or professionally synthesized voiceover can replace it later without changing the script structure.

## Public Boundary

The video must preserve these points:

```text
OrgAnchor is Fireseed Alpha, not stable v1.
OrgAnchor is not a trust badge.
OrgAnchor is not a marketplace.
OrgAnchor is not a certification authority.
OrgAnchor does not decide final trust.
OrgAnchor lowers the cost of discovery, verification, understanding, comparison, and early screening.
```

## Canonical Voiceover

Use the English voiceover from `VIDEO_SCRIPT_90S.md`.

Use `VIDEO_SCRIPT_SHORT.md` only for Chinese meaning review.

## Visual Style

Recommended style:

```text
quiet, technical, credible, non-hype;
simple motion graphics;
real UI screenshots where possible;
short text overlays;
no fake badges;
no "guaranteed trust" imagery;
no blockchain hype visuals;
no marketplace ranking visuals.
```

Avoid:

```text
gold shields;
rating stars;
"verified supplier" badges;
"permanent identity" language;
"AI chooses the best supplier" language;
```

## Shot List

Use this as the production timeline.

### 0-12s: Opening Problem

Voice:

```text
Not long ago, a polished website, a professional video, or a detailed product page still meant something. It meant effort. It meant cost. It gave people a reason to believe there might be a real organization behind it.
```

Visual:

```text
polished website mock;
professional product video frame;
detailed product page;
AI-generated variants multiplying quickly.
```

On-screen text:

```text
The old signal was appearance.
```

### 12-25s: Fragile Carriers

Voice:

```text
But AI is changing that. The look of credibility is becoming cheap. And at the same time, real organizations can lose their visible history overnight: a domain expires, a platform account is disabled, a website moves, or an old trail disappears.
```

Visual:

```text
domain expiration alert;
platform account disabled;
website moved;
search result disappearing;
old page fading out.
```

On-screen text:

```text
Domains, platforms, and pages are carriers.
They are not identity roots.
```

### 25-45s: OrgAnchor Core

Voice:

```text
OrgAnchor is built for that gap. It lets an organization publish signed records of who it is, where its official presence can be found now, what it claims, what evidence supports those claims, and what has changed over time.
```

Visual:

```text
organization root authority;
signed official-presence record;
claims;
evidence summary;
change history.
```

On-screen text:

```text
Signed identity.
Official presence.
Evidence records.
Change history.
```

### 45-62s: Verification Path

Voice:

```text
The website can still be the front door. But the website no longer has to be the only proof. People can read a public verify page, while AI agents and verification tools can inspect the underlying package, check signatures and hashes, surface evidence gaps, and show what to verify next.
```

Visual:

```text
website front door;
public /verify page;
well-known organchor.json;
compact verification JSON;
signatures and hashes passing;
evidence gaps and next checks.
```

On-screen text:

```text
Human summary.
Agent-readable package.
Checks, gaps, next steps.
```

### 62-78s: Boundary

Voice:

```text
OrgAnchor is not a trust badge. It is not a marketplace, not a certification authority, and not a final score. It does not tell you who to trust. It makes the material easier to verify.
```

Visual:

```text
four crossed-out labels:
trust badge;
marketplace;
certification authority;
final score.

then transition to:
checkable material.
```

On-screen text:

```text
Not a badge.
Not a ranking.
Not final trust.
```

### 78-90s: Fireseed Ask

Voice:

```text
OrgAnchor is now in Fireseed Alpha. We are looking for people to test it, question it, run it on real organizations, and help build a lower-cost, non-monopolistic way to verify organization identity and evidence.
```

Visual:

```text
organchor.org/verify;
GitHub repository;
npm run visible:demo;
npm run agent:demo;
Fireseed Alpha review tracks.
```

On-screen text:

```text
Fireseed Alpha
Review it. Reproduce it. Challenge it.

organchor.org/verify
github.com/OrgAnchor/OrgAnchor
```

## Publishing Copy

Primary feedback chain:

```text
YouTube -> GitHub tracking issue -> Bluesky thread -> LinkedIn post -> X mirror thread
```

Use `PUBLIC_FEEDBACK_CHAIN_PLAN.md` for platform roles and `PUBLIC_POSTS_FIRESEED_WAVE_1.md` for copyable posts.

### Recommended Title

```text
OrgAnchor: Verifiable Organization Identity and Evidence for the AI Era
```

### Shorter Title

```text
OrgAnchor: Verifiable Organization Identity for the AI Era
```

### Description

```text
AI-generated pages, videos, and product materials are making appearance cheaper than evidence. At the same time, real organizations still depend on fragile carriers: domains, websites, platform accounts, cloud providers, and scattered public records.

OrgAnchor is an open-source Fireseed Alpha project for helping organizations publish signed, recheckable public records that link identity, official presence, claims, evidence, and migration history so people and AI agents can discover, screen, verify, understand, and compare candidate organizations at lower cost.

OrgAnchor is not a trust badge, not a marketplace, not a certification authority, and not a final ranking system. It makes the material easier to verify.

Start here:
https://organchor.org/verify/

Source:
https://github.com/OrgAnchor/OrgAnchor

Fireseed Alpha asks for reviewers, pilot organizations, AI-agent builders, Directory builders, and evidence/governance critics.
```

### Pinned Comment

```text
Important boundary: OrgAnchor PASS is verification status, not trust status.

OrgAnchor reports signed identity/evidence structure, hashes, gaps, and next checks. It does not decide whether an organization is good, safe, lawful, cheap, or the best supplier.

Review path:
https://github.com/OrgAnchor/OrgAnchor
```

### Hashtags

```text
#OrgAnchor #OpenSource #AIAgents #Verification #DigitalIdentity #SupplyChain #TrustInfrastructure
```

## Thumbnail Direction

Recommended thumbnail text:

```text
Can AI Agents Verify Organizations?
```

Alternative:

```text
Organization Trust Needs Evidence
```

Visual concept:

```text
left side: polished website / AI-generated page fragments;
right side: signed records, hashes, verify page, agent-readable package;
center: OrgAnchor wordmark or plain text "OrgAnchor";
tone: serious, clean, not sensational;
avoid: shield badges, star ratings, "certified" labels, marketplace ranking visuals.
```

Suggested image-generation prompt if a generated bitmap thumbnail is needed:

```text
Create a clean, modern technology thumbnail for an open-source project called OrgAnchor. The image should contrast fragile online appearance with verifiable records: on the left, abstract website and AI-generated content panels; on the right, signed records, hash lines, and a public verify page interface. Use a restrained professional palette, high contrast, clear negative space for the title "Can AI Agents Verify Organizations?". Do not include shields, ratings, certificates, crypto coins, or marketplace rankings.
```

### Short Social Post

```text
OrgAnchor Fireseed Alpha is now ready for public review.

It helps organizations publish signed, recheckable public records that link identity, official presence, claims, evidence, and migration history so people and AI agents can verify continuity, inspect evidence, see gaps, and decide what to check next.

Not a trust badge. Not a marketplace. Not a certification authority.

https://organchor.org/verify/
https://github.com/OrgAnchor/OrgAnchor
```

## Upload Checklist

Before uploading:

```text
confirm public self-pilot is reachable;
confirm organchor verify url https://organchor.org --compact returns PASS;
use English captions from public-assets/video-90s/organchor-90s.en.srt;
optionally add Simplified Chinese captions from public-assets/video-90s/organchor-90s.zh-Hans.srt;
include the boundary in the description;
include GitHub and verify links;
do not claim stable v1;
do not claim OrgAnchor certifies organizations;
do not imply paid sponsorship changes verification status.
```

After uploading:

```text
record platform URL;
record publish timestamp;
link the video from the Fireseed tracking issue or outreach notes;
watch for feedback that indicates misunderstanding of trust boundaries;
turn concrete feedback into GitHub issues.
```
