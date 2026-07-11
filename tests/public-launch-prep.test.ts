import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const publicLaunchDocs = [
  "PUBLIC_EXPLAINER.md",
  "OUTREACH_PLAN.md",
  "FIRESEED_OUTREACH_KIT.md",
  "FIRESEED_DECK_OUTLINE.md",
  "VIDEO_SCRIPT_SHORT.md",
  "VIDEO_SCRIPT_90S.md",
  "VIDEO_SCRIPT_DEMO.md",
  "VIDEO_SCRIPT_DEEP_DIVE.md",
  "FIRESEED_VALIDATION_TRACKING_ISSUE.md",
  "PUBLIC_FEEDBACK_CHAIN_PLAN.md",
  "PUBLIC_POSTS_FIRESEED_WAVE_1.md",
  "PUBLIC_RELEASE_CHECKLIST.md",
  "PUBLIC_VIDEO_90S_RELEASE_PACK.md",
  "SPONSOR_LETTER.md"
];

test("README exposes public launch prep entry points without hiding alpha status", () => {
  const readme = readText("README.md");
  const packageJson = JSON.parse(readText("package.json")) as { name: string };

  assert.match(readme, /## 3-Minute Version/);
  assert.match(readme, /not a trust badge/i);
  assert.match(readme, /not stable v1/i);
  assert.match(readme, /NOT_ASSIGNED_BY_ORGANCHOR/);
  assert.match(readme, /npm run agent:demo/);
  assert.match(readme, /npm run visible:demo/);
  assert.match(readme, new RegExp(`npm install -g ${escapeRegExp(packageJson.name)}@alpha`));

  for (const doc of publicLaunchDocs) {
    assert.match(readme, new RegExp(escapeRegExp(doc)), `${doc} should be linked from README`);
  }
});

test("public launch prep docs are indexed and packaged", () => {
  const docsIndex = readText("DOCS_INDEX.md");
  const packageJson = JSON.parse(readText("package.json")) as { files?: string[] };

  for (const doc of publicLaunchDocs) {
    assert.match(docsIndex, new RegExp(escapeRegExp(doc)), `${doc} should be listed in DOCS_INDEX.md`);
    assert.equal(packageJson.files?.includes(doc), true, `${doc} should be included in package.json files`);
  }
});

test("design rationale is public, packaged, and aligned with the core loop", () => {
  const readme = readText("README.md");
  const docsIndex = readText("DOCS_INDEX.md");
  const packageJson = JSON.parse(readText("package.json")) as { files?: string[] };
  const rationale = readText("DESIGN_RATIONALE.md");

  assert.match(readme, /DESIGN_RATIONALE\.md/);
  assert.match(docsIndex, /DESIGN_RATIONALE\.md/);
  assert.equal(packageJson.files?.includes("DESIGN_RATIONALE.md"), true);

  for (const phrase of [
    "core goal -> required properties -> design mechanisms -> expected effects -> limits",
    "discover -> verify identity -> inspect evidence -> expose gaps -> screen commercial fit -> external decision",
    "final trust decision remains external",
    "The lockfile is not the identity root",
    "Directory builders can reduce search cost while remaining replaceable"
  ]) {
    assert.match(rationale, new RegExp(escapeRegExp(phrase), "i"));
  }
});

test("public launch prep docs preserve the Fireseed boundary", () => {
  const combined = publicLaunchDocs.map((doc) => readText(doc)).join("\n\n");

  for (const phrase of [
    "Fireseed Alpha",
    "not stable v1",
    "not a trust badge",
    "not a marketplace",
    "not a certification authority",
    "NOT_ASSIGNED_BY_ORGANCHOR",
    "S1-S3",
    "S4/S5",
    "Fireseed Alpha External Validation Wave 1",
    "Sponsorship does not buy"
  ]) {
    assert.match(combined, new RegExp(escapeRegExp(phrase), "i"));
  }
});

test("outreach plan defines a bounded publishing and sponsorship sequence", () => {
  const plan = readText("OUTREACH_PLAN.md");

  for (const phrase of [
    "Public Understanding Package",
    "Publishing Order",
    "Target Audiences",
    "Sponsorship Entry Strategy",
    "Sponsorship is not the first public action",
    "optional support for a defined validation wave",
    "open a lightweight sponsorship entry only if there is clear support interest",
    "Sponsorship must not buy",
    "Sponsorship should be tracked separately from verification",
    "GitHub Sponsors",
    "Open Collective",
    "Open Source Collective"
  ]) {
    assert.match(plan, new RegExp(escapeRegExp(phrase), "i"));
  }
});

test("public explainer exposes commercial fit without turning OrgAnchor into a marketplace", () => {
  const explainer = readText("PUBLIC_EXPLAINER.md");

  for (const phrase of [
    "Commercial Fit Without Becoming A Marketplace",
    "price disclosure mode",
    "signed private quote paths",
    "minimum order quantity",
    "OrgAnchor does not force every organization to publish prices",
    "It also does not decide which supplier is best"
  ]) {
    assert.match(explainer, new RegExp(escapeRegExp(phrase), "i"));
  }
});

test("public release checklist defines owner gates and hold criteria", () => {
  const checklist = readText("PUBLIC_RELEASE_CHECKLIST.md");

  for (const phrase of [
    "Local Verification Gate",
    "Public Self-Pilot Gate",
    "Public Asset Gate",
    "Human-Owner Intervention Gates",
    "Recommended Publishing Order",
    "Hold Criteria",
    "OrgAnchor's trust decision remains NOT_ASSIGNED_BY_ORGANCHOR",
    "Sponsorship does not buy ranking",
    "publishing videos or public posts",
    "claiming a public launch wave has succeeded"
  ]) {
    assert.match(checklist, new RegExp(escapeRegExp(phrase), "i"));
  }
});

test("90-second public video release pack is publishable without overclaiming", () => {
  const releasePack = readText("PUBLIC_VIDEO_90S_RELEASE_PACK.md");
  const englishCaptions = readText("public-assets/video-90s/organchor-90s.en.srt");
  const chineseCaptions = readText("public-assets/video-90s/organchor-90s.zh-Hans.srt");
  const packageJson = JSON.parse(readText("package.json")) as { files?: string[] };

  assert.equal(packageJson.files?.includes("public-assets/"), false);

  for (const phrase of [
    "Rendered local draft asset pack for OrgAnchor",
    "Publish a 90-second OrgAnchor concept video only after the OrgAnchor video quality gate is met",
    "OrgAnchor does not depend on a CivitasX parent-channel launch",
    "OrgAnchor is Fireseed Alpha, not stable v1",
    "OrgAnchor is not a trust badge",
    "Recommended Title",
    "Pinned Comment",
    "Thumbnail Direction",
    "Can AI Agents Verify Organizations?",
    "Upload Checklist",
    "do not claim OrgAnchor certifies organizations"
  ]) {
    assert.match(releasePack, new RegExp(escapeRegExp(phrase), "i"));
  }

  for (const phrase of [
    "OrgAnchor is now in Fireseed Alpha",
    "not a trust badge",
    "lower-cost, non-monopolistic way"
  ]) {
    assert.match(englishCaptions, new RegExp(escapeRegExp(phrase), "i"));
  }

  for (const phrase of [
    "OrgAnchor 现在处于 Fireseed Alpha",
    "OrgAnchor 不是信任徽章",
    "低成本、非垄断"
  ]) {
    assert.match(chineseCaptions, new RegExp(escapeRegExp(phrase)));
  }
});

test("public feedback chain treats Bluesky as discussion surface, not trust root", () => {
  const plan = readText("PUBLIC_FEEDBACK_CHAIN_PLAN.md");
  const posts = readText("PUBLIC_POSTS_FIRESEED_WAVE_1.md");

  for (const phrase of [
    "GitHub    -> canonical executable review",
    "Bluesky   -> first discussion chain",
    "YouTube   -> deferred canonical video host",
    "the first public conversation layer",
    "not the canonical artifact store",
    "not the source of truth",
    "not a replacement for GitHub issues",
    "@organchor.org",
    "@bsky.organchor.org"
  ]) {
    assert.match(plan, new RegExp(escapeRegExp(phrase), "i"));
  }

  for (const phrase of [
    "OrgAnchor Fireseed Alpha is ready for public review",
    "Final trust stays external",
    "S4/S5 are design previews",
    "adopting organizations, AI-agent builders, Directory builders",
    "https://github.com/OrgAnchor/OrgAnchor/issues/4"
  ]) {
    assert.match(posts, new RegExp(escapeRegExp(phrase), "i"));
  }
});

test("Bluesky first-wave posts fit the 300-character posting style", () => {
  const posts = readText("PUBLIC_POSTS_FIRESEED_WAVE_1.md");
  const blueskySection = extractSection(posts, "## Bluesky Thread", "## LinkedIn Post");
  const postBodies = [...blueskySection.matchAll(/```text\n([\s\S]*?)\n```/g)]
    .map((match) => {
      const body = match[1];
      if (body === undefined) {
        throw new Error("Expected fenced text body in Bluesky thread section");
      }
      return body.trim();
    })
    .filter((body) => !body.startsWith("@"));

  assert.equal(postBodies.length, 8);

  for (const body of postBodies) {
    assert.ok([...body].length <= 300, `Bluesky post exceeds 300 characters:\n${body}`);
  }
});

test("first-wave public posts preserve non-endorsement boundaries", () => {
  const posts = readText("PUBLIC_POSTS_FIRESEED_WAVE_1.md");

  for (const phrase of [
    "not a trust badge",
    "not a marketplace",
    "not a certification authority",
    "not a final ranking system",
    "PASS means a checked identity/evidence path passed current verification checks",
    "Final trust stays external"
  ]) {
    assert.match(posts, new RegExp(escapeRegExp(phrase), "i"));
  }
});

test("public launch prep docs do not contain common mojibake markers", () => {
  const combined = publicLaunchDocs.map((doc) => readText(doc)).join("\n\n");

  for (const marker of [
    "涓枃",
    "鍚箟",
    "銆",
    "锛",
    "鐨",
    "绛",
    "鈧",
    "????"
  ]) {
    assert.equal(combined.includes(marker), false, `public launch docs contain likely mojibake marker: ${marker}`);
  }
});

test("bilingual video scripts keep clean Chinese review guidance", () => {
  const shortScript = readText("VIDEO_SCRIPT_SHORT.md");
  const demoScript = readText("VIDEO_SCRIPT_DEMO.md");
  const deepDiveScript = readText("VIDEO_SCRIPT_DEEP_DIVE.md");

  for (const phrase of [
    "中文名称",
    "中文含义",
    "OrgAnchor 帮助组织发布经过签名、可复查的公开资料",
    "官网仍然可以是面向人的正门",
    "OrgAnchor 不是信任徽章"
  ]) {
    assert.match(shortScript, new RegExp(escapeRegExp(phrase)));
  }

  for (const phrase of [
    "中文含义",
    "现在我们生成可见演示包",
    "接下来，我们从人类视角切换到 Agent 视角",
    "关键身份记录不能被悄悄重写而不留下验证失败",
    "S4 和 S5 是真实使用观察、公开挑战、纠错、负面证据和历史问责机制的设计预览"
  ]) {
    assert.match(demoScript, new RegExp(escapeRegExp(phrase)));
  }

  for (const phrase of [
    "20 分钟深度讲解视频脚本",
    "组织根权威才是身份根",
    "悄悄改写变得可检测",
    "S3 不是无限评价堆砌",
    "S5 是公开挑战、纠错、负面证据和历史问责",
    "OrgAnchor 降低商业筛选成本，但不决定哪个供给方最好"
  ]) {
    assert.match(deepDiveScript, new RegExp(escapeRegExp(phrase)));
  }
});

function readText(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

function extractSection(source: string, startHeading: string, endHeading: string): string {
  const start = source.indexOf(startHeading);
  const end = source.indexOf(endHeading);
  assert.notEqual(start, -1, `${startHeading} not found`);
  assert.notEqual(end, -1, `${endHeading} not found`);
  assert.ok(end > start, `${endHeading} should follow ${startHeading}`);
  return source.slice(start, end);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
