# Demo Video Script

Status: Practical demo script for Fireseed Alpha.

Target length: 6-8 minutes.

Language rule:

- English voiceover is the canonical public script.
- Chinese text is meaning-aligned review guidance.
- This is a demo video, not a technical tutorial or a product launch claim.

## Goal

Show that OrgAnchor is not only an idea. Viewers should see a visible `/verify` page, a local AI-agent verification loop, compact verification output, and a tamper-failure proof.

The demo must preserve this boundary:

OrgAnchor verifies signed structure, continuity, hashes, evidence summaries, and visible gaps. It does not decide final trust.

## Segment 1: Make The Working Loop Visible

Duration: 40 seconds.

Visual:

- Title card.
- Local terminal ready to run demo commands.
- Quick preview of `/verify`, agent output, and tamper failure.

Voice EN:

"In this demo, we will show how OrgAnchor turns from an idea into something you can inspect. You will see a demo organization publish signed records of who it is, where its official presence can be found, what it claims, and what evidence it exposes. Then we will open the human-readable verify page, run agent-readable verification, and tamper with one signed record to show the check failing."

中文含义：

在这个演示里，我们会展示 OrgAnchor 如何从一个想法变成你可以检查的东西。你会看到一个演示组织发布签名记录：它是谁、在哪里可以找到它的官方存在、它主张什么、它暴露了哪些证据。然后我们会打开人类可读的 verify 页面，运行 Agent 可读的验证，并篡改一条签名记录来展示检查失败。

## Segment 2: Generate And Serve The Visible Demo Package

Duration: 70 seconds.

Command:

```bash
npm run visible:demo -- --out ./visible-demo --serve
```

Show:

- terminal command and generated workspace path;
- generated local verify URL;
- `public/verify/index.html`;
- `outputs/compact-verify.json`;
- `outputs/tamper-compact-verify.json`;
- `outputs/visible-acceptance-summary.md`.

Voice EN:

"Now we generate the visible demo package. This command creates a safe local demo organization, signs its identity and official-presence records, creates claims and evidence summaries, builds the public verify page, runs normal compact verification, creates a tampered copy, and confirms that the tampered record fails verification. The server stays open so we can inspect the results step by step."

中文含义：

现在我们生成可见演示包。这个命令会创建一个安全的本地演示组织，签署身份和官方存在记录，创建主张与证据摘要，生成公开 verify 页面，运行正常 compact 验证，创建一份被篡改的副本，并确认被篡改记录验证失败。服务器会保持开启，方便我们接下来逐步检查这些结果。

Explain:

- This is one command, but it produces several inspectable artifacts.
- The rest of the video opens those artifacts one by one.
- The demo does not use production private keys or external credentials.
- If `./visible-demo` already exists and is not empty, use a new output directory or clear it before recording.

## Segment 3: Human-Readable `/verify`

Duration: 70 seconds.

Open the local URL shown by the command.

Show:

- organization identity section;
- root authority / signature status;
- official presence or endpoint information;
- evidence / value summaries;
- risk gaps or limitations;
- visible `PASS` boundary if present.

Voice EN:

"Now we open the human-readable verify page. Think of it as the first readable summary layer. It should help a person understand who the organization says it is, where its official presence can be found, whether the current signed path passes, what evidence is summarized, and which gaps or limitations need attention. The full package may contain many more signed records and evidence entries; that complete record set is for AI agents and verification tools to read, filter, and check in detail."

中文含义：

现在我们打开人类可读的 verify 页面。你可以把它理解成第一层可读摘要。它应该帮助普通人理解：这个组织声称自己是谁、在哪里可以找到它的官方存在、当前签名路径是否通过、有哪些证据摘要、哪些缺口或限制需要注意。完整资料包未来可能包含更多签名记录和证据条目；那套完整记录集应由 AI Agent 和验证工具读取、筛选和详细检查。

Boundary EN:

"A pass here is not a trust score. It means this verification path passed defined checks."

中文含义：

这里的通过不是信任分数，只表示这条验证路径通过了定义好的检查。

## Segment 4: From Human View To Agent View

Duration: 80 seconds.

Command:

```bash
npm run agent:demo
```

Show:

- possible organization website;
- OrgAnchor signal;
- saved candidate;
- need match;
- signed package verification;
- risk gaps / next checks.

Voice EN:

"Next, we switch from the human view to the agent view. For an organization website that adopts OrgAnchor, an agent can use OrgAnchor tools to check whether the site exposes a standard OrgAnchor signal. If it does, the agent reads that signal, records the organization as a candidate, compares it with the current need, and, when necessary, fetches the signed source package from the organization itself for deeper verification."

中文含义：

接下来，我们从人类视角切换到 Agent 视角。对于应用了 OrgAnchor 规范的某个组织官网，Agent 可以调用 OrgAnchor 工具，先检查该官网是否提供标准的 OrgAnchor 信号。如果有，Agent 会读取这个信号，把该组织记录为候选对象，将它与当前需求进行比较，并在需要时从该组织自身获取签名源头资料包，进行更深入验证。

Explain:

- The signal helps an agent recognize an OrgAnchor adopter.
- The candidate list helps repeated discovery and comparison.
- Need matching is only a first filter.
- Deeper verification still returns to the organization's own signed package.
- This does not mean OrgAnchor is a global search engine or final recommendation system.

## Segment 5: Read The Compact Verification Briefing

Duration: 60 seconds.

Open or show:

```text
./visible-demo/outputs/compact-verify.json
```

If recording from a live local server, the same result can be regenerated with:

```bash
organchor verify url <local-demo-url> --compact
```

Show key fields:

- `overall_status`;
- `identity_status`;
- `value_status`;
- `conformance_status`;
- `trust_decision: NOT_ASSIGNED_BY_ORGANCHOR`;
- `policy_route`;
- `risk_gaps`;
- `next_best_actions`.

Voice EN:

"Segment 4 showed how an agent reaches a candidate and runs verification. Now we pause on what comes back. The compact result is a short verification briefing that an agent can pass into its own policy: did the identity path pass, what evidence state was found, does the package conform, what gaps remain, and what should be checked next. The key field is `trust_decision: NOT_ASSIGNED_BY_ORGANCHOR`. OrgAnchor reports the material path it checked. It does not decide whether to buy, approve, partner, or trust."

中文含义：

Segment 4 展示了 Agent 如何找到候选对象并运行验证。现在我们停下来看看验证返回了什么。compact result 是一份短的验证简报，Agent 可以把它交给自己的策略系统：身份路径是否通过、发现了什么证据状态、资料包是否符合规范、还有哪些缺口、下一步应该检查什么。关键字段是 `trust_decision: NOT_ASSIGNED_BY_ORGANCHOR`。OrgAnchor 报告它检查过的资料路径，但不决定是否购买、批准、合作或信任。

## Segment 6: Compare Normal And Tampered Results

Duration: 70 seconds.

Open or show:

```text
./visible-demo/outputs/compact-verify.json
./visible-demo/outputs/tamper-compact-verify.json
```

Show:

- normal result: `overall_status: PASS`;
- tampered result: `overall_status: FAIL`;
- tampered identity status: `FAIL`;
- tampered policy route: `STOP_IDENTITY_FAILURE`;
- statement hash or signature mismatch in the failure details.

Voice EN:

"Now we compare the normal result with the tampered result. In the demo, one signed official-presence record was changed after signing. The page can still exist, but the material path no longer matches the declared hashes and valid signatures. The compact result moves from PASS to FAIL, and the policy route becomes `STOP_IDENTITY_FAILURE`. This is the integrity line OrgAnchor is trying to make visible: important identity records cannot be silently rewritten without leaving a verification failure."

中文含义：

现在我们对比正常结果和篡改结果。在这个 demo 里，一条已经签名的官方存在记录在签名后被修改。页面仍然可以存在，但资料路径已经无法匹配声明的哈希和有效签名。compact 结果会从 PASS 变成 FAIL，策略路径变成 `STOP_IDENTITY_FAILURE`。这就是 OrgAnchor 想让人看见的完整性边界：关键身份记录不能被悄悄重写而不留下验证失败。

## Segment 7: Evidence Maturity And Fireseed Ask

Duration: 80 seconds.

Open briefly:

- `outputs/visible-acceptance-summary.md`;
- `CLAIMS_EVIDENCE_PROTOCOL.md`;
- `S2_THIRD_PARTY_MATERIAL_MODEL.md`;
- `S3_RANDOM_SAMPLING_MODEL.md`;
- `CAPABILITY_TRACEABILITY_MATRIX.md`;
- `CALL_FOR_FIRESEED_REVIEW.md`.

Voice EN:

"This demo shows a working alpha loop, not finished governance. The evidence layer is intentionally explicit about maturity. S1-S3 is the current alpha baseline: organization-provided evidence, organization-submitted third-party material, and random purchase or sampling structure. S4 and S5 are design previews for real-use observation, public challenge, correction, negative evidence, and historical accountability. The important rule is that OrgAnchor should expose gaps instead of hiding them."

中文含义：

这个 demo 展示的是一个能跑的 Alpha 闭环，不是完成的治理系统。证据层会明确标出成熟度。S1-S3 是当前 Alpha 基线：组织自证资料、组织提交的第三方资料、随机购买或抽样结构。S4 和 S5 是真实使用观察、公开挑战、纠错、负面证据和历史问责机制的设计预览。重要规则是：OrgAnchor 应该暴露缺口，而不是隐藏缺口。

Close EN:

"Fireseed Alpha is the point where this loop should leave our own hands. We need people to reproduce it, question it, test it with low-risk organizations, review the evidence model, and tell us where the path is confusing, weak, or misleading."

中文含义：

Fireseed Alpha 是这个闭环应该走出我们自己手里的节点。我们需要有人复现它、质疑它、用低风险组织试点它、审查证据模型，并告诉我们哪里令人困惑、薄弱或可能误导。

Screen text:

```text
npm run visible:demo -- --out ./visible-demo --serve
npm run agent:demo
organchor verify url <local-or-public-organchor-url> --compact
github.com/OrgAnchor/OrgAnchor
```
