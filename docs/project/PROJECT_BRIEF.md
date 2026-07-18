# OrgAnchor Project Brief

Status: Foundational project brief. Use `PROJECT_NORTH_STAR.md` and `IMPLEMENTATION_STATUS.md` for current direction and capability state.

## 一句话定位

OrgAnchor 帮助组织发布经过签名的官方入口声明，使组织在域名、平台和基础设施发生变化时，仍然能够保持可验证的在线身份连续性。

English positioning:

> OrgAnchor helps organizations publish signed official endpoint statements so that their online presence remains verifiable across domain, platform, and infrastructure changes.

## 项目目标

OrgAnchor 是一个面向组织的在线身份锚定工具。

它要解决的核心问题是：

> 一个组织的在线身份不应该只依赖域名、官网、平台账号或云服务商。当这些入口发生故障、迁移、封禁、被盗、停服或争议时，外界仍然应该能够验证：哪个入口是组织后来重新声明的官方入口，哪些历史声明是真实连续的。

OrgAnchor 不追求创造一个“永不死亡的网站”。它追求的是让组织在入口变化时仍然可以证明：

- 过去的官方声明是谁签发的。
- 当前的官方入口是否由同一个组织身份根重新声明。
- 关键声明是否可以被长期归档、镜像和追溯。
- 产品、服务、承诺和证明材料是否可以被机器读取、验证完整性并追溯来源。
- 传统域名、去中心化承载体和灾备入口之间是否能互相印证。

## 核心原则

### 1. 根身份来自组织根权威

OrgAnchor 的身份根是组织自己定义并长期维护的根权威，而不是域名、ENS、平台账号、云服务商、Arweave、IPFS 或 Onion。

根权威的最小形态可以是一把根公钥，也就是 `1-of-1`。当组织成长后，根权威应能升级为一组根公钥和一条阈值规则，例如 `2-of-3`、`3-of-5` 或 `5-of-9`。

这些外部系统可以帮助发布、发现、镜像和归档，但不能替代根权威成为最终信任基础。

OrgAnchor 应明确反对“多人长期共享同一个私钥”。更合理的模型是每个负责人持有自己的私钥，由多个独立签名共同满足组织根权威规则。

### 2. 当前官方入口来自签名声明

OrgAnchor 的核心产物是 `official-endpoints.json` 和它的签名文件。

任何人都应该能通过根权威验证：

- 这个声明是否满足组织根权威的签名规则。
- 声明内容是否被篡改。
- 声明中的官网、验证页、代码仓库、API、文档、安全邮箱等入口是否是组织当前声明的官方入口。

OrgAnchor v1 默认使用 Ed25519 签名，但身份连续性不应绑定到任何单一算法。密码学策略见 `docs/project/CRYPTO_POLICY.md`。

### 3. 外部承载体只负责增强可用性和可追溯性

OrgAnchor 使用多个承载体分别解决不同风险：

- Arweave：长期归档关键声明。
- IPFS：内容寻址、镜像分发和 CID 验证。
- Onion：极端情况下的灾备访问入口。
- 传统域名：现实世界最常用的发现入口，需要安全加固。
- ENS：Web3 和去中心化命名生态的辅助名称。

这些承载体都不是绝对可靠的。OrgAnchor 的设计必须明确每个承载体的能力和边界。

### 4. 可验证优先于可宣传

OrgAnchor 不使用夸大表达，不承诺：

- 永不消失。
- 绝对抗封禁。
- 完全去中心化。
- 永久身份。
- 替代域名。
- 替代政府登记。
- 替代法律实体证明。

正确表达是：

- 降低域名、平台、服务器单点风险。
- 提高组织入口迁移时的可验证性。
- 让组织关键身份声明可存档、可镜像、可验证、可追溯。

## 目标用户

OrgAnchor v1 优先服务这些组织：

- 开源项目和维护团队。
- 公益组织和研究团体。
- 安全敏感的媒体、社区、基金会或小型机构。
- 希望降低域名、平台、云服务单点风险的公司或团队。
- 需要在多个入口之间保持可信连续性的长期项目。

v1 不优先服务：

- 需要完整 SaaS 后台的企业客户。
- 需要组织内部权限管理的团队。
- 需要 DID 钱包、VC 发行或 DAO 治理的 Web3 项目。
- 需要托管身份服务的非技术用户。

## 产品边界

OrgAnchor 做：

- 组织根密钥生成、公钥导出和根权威描述。
- 官方入口声明创建、签名、验证和哈希。
- 产品/服务声明清单和证据清单。
- 静态 `/verify` 页面生成。
- Arweave 归档。
- IPFS 镜像。
- Onion 灾备入口登记、校验和配置生成。
- 传统域名安全审计。
- ENS 辅助名称检查和设置计划。
- 迁移声明和密钥轮换计划。
- 发布结果 lockfile 记录。

OrgAnchor 不做：

- 自创区块链。
- 自创 DID method。
- 完整 DID 钱包。
- VC 发行平台。
- DAO 治理。
- 组织内部权限系统。
- SaaS 用户账户系统。
- CMS。
- 托管服务。
- 浏览器插件。
- 去中心化搜索网络。

## v1 应达到的完整体验

一个组织应能完成如下流程：

```bash
organchor init
organchor key generate --id root-2026
organchor statement create
organchor statement sign
organchor statement verify
organchor page generate
organchor claims create
organchor claims sign
organchor claims verify
organchor evidence create
organchor evidence sign
organchor evidence verify
organchor mirror ipfs publish
organchor archive arweave publish
organchor domain audit example.com
organchor onion config generate --domain exampleonionaddress.onion
organchor ens plan exampleorg.eth
organchor migrate create
```

完成后，组织应拥有：

- 一个组织根权威。最小形态是一把根公钥，成熟形态是一组根公钥和阈值规则。
- 一个签名官方入口声明。
- 一组签名的产品/服务声明和证据清单。
- 一个可放在官网、IPFS 或 Onion 的 `/verify` 页面。
- 一个记录发布结果、哈希、CID、Arweave TX 的 `organchor.lock.json`。
- 一个域名安全审计报告。
- 一个 ENS 设置计划或验证结果。
- 一个迁移声明机制，用于未来官方入口或根密钥变化。

## v1 成功标准

OrgAnchor v1 不以“支持最多平台”为成功标准，而以“端到端可信闭环”作为成功标准。

v1 必须能证明：

- 同一份声明即使 JSON 字段顺序不同，计算出的 canonical hash 一致。
- 声明任意字段被修改后，签名验证失败。
- 错误公钥或不满足阈值规则的签名集合无法验证声明。
- 缺少必填字段时声明无效。
- Arweave 或 IPFS 上的内容 hash 与本地不一致时验证失败。
- 产品/服务声明和证据清单可由 AI agent 读取，并能校验证据 artifact hash。
- ENS 记录与声明不一致时验证失败。
- Onion 地址格式错误时验证失败。
- 域名审计结果能清楚区分 `PASS`、`WARN`、`FAIL`、`MANUAL_CHECK_REQUIRED`。

## 推荐默认决策

这些默认决策用于减少早期讨论成本，后续如有充分理由可以调整：

- 项目名：`OrgAnchor`
- CLI 名：`organchor`
- 语言：TypeScript
- 运行环境：Node.js
- 许可证：Apache-2.0
- 配置文件：`organchor.config.json`
- 状态文件：`organchor.lock.json`
- 声明文件：`statements/official-endpoints.json`
- 签名文件：`statements/official-endpoints.json.sig`
- 验证页目录：`public/verify`
- 私钥目录：`keys`
- 报告目录：`reports`

## 需要持续坚持的判断

每加入一个功能，都应回答：

- 它是否增强身份连续性？
- 它是否让用户更容易验证官方入口？
- 它是否让 AI agent 更容易核验组织声明和证据链？
- 它是否引入新的单点依赖？
- 它是否把辅助承载体误设计成身份根？
- 它是否把组织治理风险错误压缩到单一私钥上？
- 它的失败模式是否清楚？
- 它是否会把 OrgAnchor 推向无边界产品？

如果答案不清楚，这个功能应暂缓。
