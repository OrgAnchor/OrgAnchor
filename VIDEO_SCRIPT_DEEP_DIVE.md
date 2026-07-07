# Deep Dive Video Script

Status: Fireseed Alpha 20-minute deep-dive script.

中文名称：20 分钟深度讲解视频脚本，中英同步审阅版。

Target length: 20 minutes.

Language rule:

- English voiceover is the canonical public script.
- Chinese text is meaning-aligned review guidance, not a separate public script.
- The video should explain the system logic, not become a CLI tutorial.
- Keep all maturity boundaries explicit. Do not present Fireseed Alpha as stable v1.

Purpose: Explain the architecture, evidence layer, S1-S3 Fireseed boundary, Directory strategy, commercial-fit layer, and history/continuity model without turning OrgAnchor into a trust badge.

## Segment 1: Why OrgAnchor Exists

Duration: 2 minutes.

Message:

The online verification problem is changing. AI-generated content makes visual polish cheap, while organizations still depend on fragile carriers such as domains, platforms, websites, cloud providers, archives, and certification pages.

Voice EN:

"OrgAnchor exists because organizations should not have to prove themselves only through scattered carriers. Websites, domains, platform accounts, reports, certificates, and public materials matter, but they rarely form a unified verifiable chain by default. At the same time, polished pages and videos are becoming cheaper to create. OrgAnchor helps organizations publish signed, recheckable public records that link identity, official presence, claims, evidence, and migration history so people and AI agents can discover, screen, verify, understand, and compare candidate organizations at lower cost when carriers change."

中文含义：

OrgAnchor 存在的原因，是组织不应该只能靠零散载体证明自己。官网、域名、平台账号、报告、证书和公开材料都很重要，但它们很少天然形成统一可验证链。同时，精美页面和视频的生成成本正在下降。OrgAnchor 帮助组织发布经过签名、可复查的公开资料，将身份、官方入口、主张、证据和迁移历史串联起来，使人和 AI Agent 在承载体变化时，能以更低成本发现、初筛、验证、理解和比较候选组织。

Show:

- domain;
- platform account;
- website;
- archive;
- IPFS/Arweave/OpenTimestamps as carriers or anchors;
- AI Agent asking who is official.

## Segment 2: The Root Principle

Duration: 2 minutes.

Message:

The organization root authority is the identity root. Carriers are not roots.

Voice EN:

"The core rule is simple: the organization root authority is the identity root. Carriers are useful, but they are not the root. The root authority signs official-presence records. Migration records preserve continuity when the authority evolves. Websites, IPFS, Arweave, Onion, ENS, Directories, and lockfiles can carry or discover records, but none of them should become the final identity root."

中文含义：

核心规则很简单：组织根权威才是身份根。承载体有用，但不是根。根权威签署官方存在记录；当根权威演化时，迁移记录保留连续性。官网、IPFS、Arweave、Onion、ENS、目录和 lockfile 都可以承载或发现记录，但它们都不应该成为最终身份根。

Boundary EN:

"A domain can help discovery, but it should not be the final identity root."

中文含义：

域名可以帮助发现，但不应该成为最终身份根。

## Segment 3: History, Continuity, And Tamper Visibility

Duration: 2 minutes.

Message:

OrgAnchor does not make history impossible to delete everywhere. It makes important changes signed, hash-linked, and easier to compare across carriers and external anchors.

Voice EN:

"OrgAnchor does not promise that every copy of history will live forever. Its stronger claim is narrower and more useful: important identity and evidence records should be signed, hashed, and published through multiple carriers so silent rewriting becomes detectable. If a statement changes after signing, verification fails. If authority changes, migration records should explain the transition. If long-term public timestamping is used, OpenTimestamps or Bitcoin anchors can add an external time proof. Arweave can serve as a high-value public archive for small final records, while IPFS and websites can help distribution and mirroring."

中文含义：

OrgAnchor 不承诺每一份历史资料都会永远存在。它更准确、更有用的目标是：重要身份和证据记录应该被签名、哈希，并通过多个承载体发布，使悄悄改写变得可检测。签名后的声明被改动，验证应失败；根权威变化，迁移记录应解释连续性；如果使用长期公开时间戳，OpenTimestamps 或 Bitcoin 锚点可以增加外部时间证明。Arweave 适合存小型、最终确认的高价值公开记录；IPFS 和官网适合分发与镜像。

## Segment 4: Minimum Useful Loop

Duration: 3 minutes.

Flow:

1. Organization creates root authority.
2. It signs an official-presence record.
3. It generates a public `/verify` package.
4. It exposes `/.well-known/organchor.json`.
5. An AI Agent runs compact verification.
6. The Agent receives identity status, value status, conformance status, policy route, risk gaps, and next actions.

Show command:

```bash
npm run visible:demo -- --out ./visible-demo --serve
organchor verify url <local-or-public-organchor-url> --compact
```

Voice EN:

"The minimum useful loop is not a grand trust system. It is a practical inspection path. A signed package is published, a public verify page helps humans see the summary, and a compact verification result gives AI agents a structured briefing. The deliberate field is `NOT_ASSIGNED_BY_ORGANCHOR`: OrgAnchor reports what it checked, but final trust remains outside OrgAnchor."

中文含义：

最小有用闭环不是宏大的信任系统，而是一条实际可检查路径。组织发布签名资料包；公开 verify 页面帮助人看摘要；compact 验证结果给 AI Agent 一份结构化简报。关键字段是 `NOT_ASSIGNED_BY_ORGANCHOR`：OrgAnchor 报告它检查了什么，但最终信任判断不属于 OrgAnchor。

## Segment 5: Evidence Layer

Duration: 3 minutes.

Message:

Identity continuity alone is not enough. A buyer, partner, or AI Agent also needs to know whether product/service claims have support.

Voice EN:

"Identity continuity alone is not enough. A real buyer or partner needs to know what the organization claims, what evidence supports the claim, what is stale, what is missing, and what should be checked next. OrgAnchor treats evidence as structured support, not as decoration. Claims are signed statements about products, services, capabilities, commercial fit, or continuity. Evidence manifests record artifacts, hashes, locations, methods, limitations, freshness, and support relations."

中文含义：

仅有身份连续性不够。真实买方、合作方或 AI Agent 还需要知道组织主张了什么、哪些证据支持这些主张、哪些资料过期、哪些缺失、下一步应该检查什么。OrgAnchor 把证据当作结构化支撑，而不是装饰。Claims 是关于产品、服务、能力、商业适配或连续性的签名主张；Evidence manifests 记录资料、哈希、位置、方法、限制、新鲜度和支撑关系。

Use this line:

"OrgAnchor should help an AI Agent ask better next questions. It should not hide gaps behind a badge."

中文含义：

OrgAnchor 应该帮助 AI Agent 问出更好的下一步问题，而不是用徽章掩盖缺口。

## Segment 6: S1-S3 Fireseed Baseline

Duration: 4 minutes.

S1: First-party evidence.

- Submitted by the organization.
- Useful for specifications, policies, official explanations, signed price sheets, public docs, demos, and product/service descriptions.
- Trust meaning: this is what the organization officially claims and is accountable for.

S2: Organization-submitted third-party material.

- Still submitted by the organization.
- Useful for certificates, lab reports, audit letters, public registry records, or third-party-looking documents.
- OrgAnchor should expose recheck routes and mechanical consistency checks.
- Trust meaning: stronger than pure self-claim only when scope, issuer, dates, subject binding, and recheck path are clear.

S3: Random purchase / sampling structure.

- Designed to reduce hand-picked-sample bias.
- Requires sample identity, sample source, acquisition route, bounded active sample pool, and raw availability state.
- Trust meaning: evidence about market/customer-site sample conformance, not long-term operational continuity.

Voice EN:

"Fireseed Alpha treats S1-S3 as the minimum evidence baseline. S1 is what the organization officially claims. S2 is third-party material still submitted by the organization, with recheck routes and consistency checks exposed. S3 is the random purchase or sampling structure designed to reduce hand-picked-sample bias. S3 is not unlimited review spam: it needs bounded active sample pools, credential gates, duplicate controls, and clear raw-material storage state."

中文含义：

Fireseed Alpha 把 S1-S3 作为最小证据基线。S1 是组织自己的官方主张；S2 是组织提交的第三方材料，并暴露复查路径和一致性检查；S3 是随机购买或抽样结构，用来降低“企业挑样送检”的偏差。S3 不是无限评价堆砌：它需要有界活跃样本池、凭据门槛、重复控制和清晰的原始材料存储状态。

Boundary EN:

"S1-S3 are the current Fireseed evidence baseline. S4 and S5 remain design previews for co-builders."

中文含义：

S1-S3 是当前 Fireseed 证据基线；S4 和 S5 仍然是留给共建者继续打磨的设计预览。

## Segment 7: S4/S5 Boundary And Historical Accountability

Duration: 2 minutes.

Message:

S4 and S5 are important, but they are not complete implementation claims in Fireseed Alpha.

Voice EN:

"S4 is real-use observation: delivery continuity, field performance, support experience, operational reliability, and time-window evidence. S5 is public challenge, correction, negative evidence, and historical accountability. This includes exposing credible problems, tracking whether an organization responds, and preserving important moments that may matter to future decisions. These layers are necessary for a mature ecosystem, but Fireseed Alpha should not pretend they are solved. The current duty is to make the boundary visible and invite focused review."

中文含义：

S4 是真实使用观察：交付连续性、现场表现、售后体验、运营稳定性和时间窗口证据。S5 是公开挑战、纠错、负面证据和历史问责：包括暴露可信问题、追踪组织是否回应，以及保留未来决策可能需要的重要历史节点。这些层级对成熟生态很重要，但 Fireseed Alpha 不能假装已经解决。当前职责是把边界讲清楚，并邀请外部共同审查。

## Segment 8: Directory Without Monopoly

Duration: 2.5 minutes.

Problem:

If no one can find OrgAnchor-enabled organizations, verification value is weakened.

Architecture:

- Beacon: every adopter can publish an origin-owned discovery signal.
- Sweep: third parties can collect public Beacons.
- Local index: any organization or AI Agent can build its own database.
- Directory: optional accelerator, not a trust root.

Voice EN:

"Discovery matters. If no one can find OrgAnchor adopters, verification value is weakened. The answer should not be a single official gatekeeper. Every adopter can publish an origin-owned Beacon. Third parties can sweep public Beacons. AI agents can build local indexes. Directories can accelerate discovery, but they must remain replaceable and must not become the trust root."

中文含义：

发现能力很重要。如果没人能找到 OrgAnchor 采用者，验证价值会被削弱。但答案不应该是单一官方入口垄断。每个采用者都可以发布自己源站拥有的 Beacon 信号；第三方可以抓取公开 Beacon；AI Agent 可以建立本地索引；Directory 可以加速发现，但必须可替换，不能成为信任根。

## Segment 9: Commercial Fit Layer

Duration: 2 minutes.

Problem:

Verification still wastes time if price, lead time, MOQ, service region, language, or quote route are invisible.

OrgAnchor direction:

- price disclosure mode;
- signed public price sheet when appropriate;
- private signed quote path when public pricing is not suitable;
- lead time;
- MOQ;
- validity window;
- support/contact route.

Voice EN:

"Lowering transaction cost also requires commercial fit. A supplier may be real and capable, but still unsuitable because price, lead time, minimum order quantity, service region, language, or quote route does not match the need. OrgAnchor should expose commercial-fit signals without becoming a marketplace. Public prices can be signed when appropriate. Private quotes can be signed when public pricing is not suitable. The goal is to reduce useless inquiries, not to decide which supplier is best."

中文含义：

降低交易成本也需要商业适配。一个供给方可能真实、有能力，但仍然不适合某个需求，因为价格、交期、最小起订量、服务区域、语言或询价路径不匹配。OrgAnchor 应该暴露商业适配信号，但不能变成市场。适合公开报价时，可以签名公开价格表；不适合公开价格时，可以提供签名私有报价路径。目标是减少无效询盘，而不是决定谁是最佳供给方。

Boundary EN:

"OrgAnchor reduces commercial screening cost. It does not decide which supplier is best."

中文含义：

OrgAnchor 降低商业筛选成本，但不决定哪个供给方最好。

## Segment 10: What Is Already Done And What Is Missing

Duration: 2 minutes.

Already done:

- CLI;
- root authority and signatures;
- migration continuity;
- `/verify`;
- Beacon discovery;
- compact agent verification;
- signed claims/evidence;
- S2/S3 alpha checks;
- visible demo;
- agent demo;
- package and capability audits.

Missing:

- broad external pilot;
- S4/S5 implementation maturity;
- delegated product/service credential layer;
- stronger real-world evidence workflows;
- external Directory builders;
- funding and review for sustained Fireseed validation.

Voice EN:

"The current project is a seed with a working loop, not a finished civilization-scale trust infrastructure. The CLI, root authority, signatures, migration continuity, verify package, Beacon discovery, compact agent result, signed claims/evidence, S2/S3 alpha checks, visible demo, and audits are in place. The missing work is equally important: external pilots, S4/S5 maturity, delegated product/service credentials, stronger real-world evidence workflows, external Directory builders, and sustained review."

中文含义：

当前项目是一颗已经能跑出闭环的种子，不是完成的文明级信任基础设施。CLI、根权威、签名、迁移连续性、verify 资料包、Beacon 发现、compact Agent 结果、签名 claims/evidence、S2/S3 Alpha 检查、可见演示和审计已经存在。缺失的工作同样重要：外部试点、S4/S5 成熟度、产品/服务授权凭据层、更强的真实世界证据流程、外部 Directory 建设者和持续审查。

## Segment 11: Fireseed Ask

Duration: 1 minute.

Ask for:

- early reviewers;
- pilot organizations;
- AI-agent builders;
- Directory builders;
- evidence/governance reviewers;
- sponsors for a defined Fireseed Alpha validation wave.

Close EN:

"We are not asking the world to trust OrgAnchor. We are asking serious people to verify the direction, reproduce the demos, find weak points, and help build a lower-cost evidence substrate for organizations."

中文含义：

我们不是要求世界信任 OrgAnchor。我们是在邀请严肃的人来验证方向、复现演示、找出弱点，并一起建设一种更低成本的组织证据底座。
