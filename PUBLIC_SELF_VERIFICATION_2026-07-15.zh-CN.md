# Fireseed Alpha.4 公开自验证验收

状态：通过，可进入外部 Fireseed 审阅

检查时间：`2026-07-15T01:40:59Z`

版本：`organchor@0.1.0-alpha.4`

英文原文：`PUBLIC_SELF_VERIFICATION_2026-07-15.md`

## 用途

这份记录检查外部审阅者能否访问 OrgAnchor 的公开入口、安装已发布的软件包、发现 OrgAnchor Beacon，并独立完成公开验证流程。

它是一份可复现性和发布一致性记录。它不是对 OrgAnchor 的认证，不证明所有公开主张都真实，不提供供应商推荐，也不宣称已经达到稳定 v1。

## 验收清单

- [x] 源码提交、发布标签与 npm 软件包的 `gitHead` 指向同一提交。
- [x] GitHub 预发布公开可访问。
- [x] npm 已通过 `alpha` 标签发布 `0.1.0-alpha.4`。
- [x] 软件包可在 Node.js 24 的全新临时目录中成功安装。
- [x] 官网首页可以 HTML 形式访问。
- [x] 面向人类的 `/verify/` 页面可以 HTML 形式访问。
- [x] well-known Beacon 可以 JSON 形式访问。
- [x] 面向机器的验证索引可以 JSON 形式访问。
- [x] `organchor doctor` 返回 `READY`，没有阻断问题和警告。
- [x] `organchor beacon inspect` 返回 `PASS`，并完成严格验证。
- [x] `organchor verify url --compact` 返回身份、价值资料和协议兼容性验证结果。
- [x] 精简结果明确把最终信任判断留给 OrgAnchor 之外的判断方。
- [x] 公开 lockfile 和承载体收据可通过公开资料包完成验证。
- [x] Alpha 阶段边界和证据缺口仍然清楚可见。

## 发布关联关系

| 表面 | 实际结果 |
| --- | --- |
| 源码提交 | `7a77fb69748a5b65c112f68c66ec15ba419e7cee` |
| Git 标签 | `v0.1.0-alpha.4` 指向同一源码提交 |
| GitHub Release | 公开预发布：`OrgAnchor 0.1.0-alpha.4` |
| npm 软件包 | `organchor@0.1.0-alpha.4` |
| npm `gitHead` | 与源码提交一致 |
| npm 发布标签 | `alpha -> 0.1.0-alpha.4` |
| npm 来源证明 | Registry 元数据公开 SLSA 来源证明 |
| 发布工作流 | GitHub Actions 运行 `29378132847`：`success` |

公开 Release：https://github.com/OrgAnchor/OrgAnchor/releases/tag/v0.1.0-alpha.4

npm 软件包：https://www.npmjs.com/package/organchor/v/0.1.0-alpha.4

## 公开入口检查

下列哈希是检查时各 HTTP 响应字节的快照。它们有助于复现本次检查，但不是协议的信任根；合法部署发生后，它们可能变化。

| 表面 | HTTP | 内容类型 | SHA-256 |
| --- | ---: | --- | --- |
| `https://organchor.org/` | `200` | `text/html; charset=utf-8` | `bf4a8a3fd8ae6404c52c2b7ebf187f40d45236ca90cfb2b30b66973d29022947` |
| `https://organchor.org/verify/` | `200` | `text/html; charset=utf-8` | `805b48ec4844ab0d3db69a9cd43dbae9dd100ae5a78b5a1dc2ab2ac81cb8f549` |
| `https://organchor.org/.well-known/organchor.json` | `200` | `application/json; charset=utf-8` | `18b94c020de16abd6c5db89940fab134004e6763ba870826aaf03a3a998ea1b6` |
| `https://organchor.org/verify/organchor.json` | `200` | `application/json; charset=utf-8` | `5cd8c8b12d9c948c05377a52a725a68edc97cb2ec9a4d376302e9fa5726d12d8` |

实际页面标题：

```text
官网首页：OrgAnchor - Verifiable Organization Continuity
验证页面：OrgAnchor Verification
```

## 全新安装检查

已在新建临时目录中从 npm 安装公开软件包：

```text
Node.js：v24.15.0
软件包：organchor@0.1.0-alpha.4
安装结果：通过
```

下方公开检查使用的是刚安装的 CLI，而不是源码目录中的开发版本。

## Agent 验证结果

Doctor 实际结果：

```text
status: READY
conformance_status: FULL_COMPATIBLE
blocking_issues: 无
warnings: 无
missing_capabilities: 无
```

Beacon 检查实际结果：

```text
status: PASS
conformance_status: FULL_COMPATIBLE
signal_url: https://organchor.org/.well-known/organchor.json
strict_identity_verification: PASS
strict_value_verification: PASS
```

精简验证实际结果：

```text
overall_status: PASS
identity_status: PASS
value_status: PASS
conformance_status: FULL_COMPATIBLE
trust_decision: NOT_ASSIGNED_BY_ORGANCHOR
lockfile: PASS
carrier_receipts: PASS
```

通过验证的公开标识为：

```text
root_authority_hash: sha256:7d720aa028e4b3b94d47b8e8789b0d7f5c8bb0564e80fac7f0ad7b275718e1b9
statement_hash: sha256:5811e45488c093e8820b35edf144a8dbae0c20a79063a44993043bfdf26a0a36
lockfile_hash: sha256:f67473676a29ccd17008a22a46e94047d6b8b66a85f8c4fe35309e8aab92b471
```

## 复现检查

这个 Alpha 软件包要求 Node.js 24 或更高版本。

```bash
mkdir organchor-alpha4-review
cd organchor-alpha4-review
npm init -y
npm install organchor@alpha
npx organchor doctor https://organchor.org
npx organchor beacon inspect https://organchor.org
npx organchor verify url https://organchor.org --compact
```

不安装软件包也可以检查发布元数据：

```bash
npm view organchor dist-tags --json
npm view organchor@0.1.0-alpha.4 version gitHead dist.integrity dist.attestations --json
```

## 已公开的证据边界

当前公开资料包报告：

```text
证据条目：36
可复现主张：1
第三方主张：0
人工检查项：37
风险缺口：3
```

最主要的公开缺口是：

- 当前只关联了第一方证据；
- 部分证据尚未与足够精确的对象绑定，机器无法完整检查覆盖关系；
- 仍然存在需要人工处理的证据检查项。

当前 self-pilot 没有声明有效的 S2 第三方材料、S3 随机抽样证据或 S4 真实使用观察证据。这些缺失会被明确暴露给外部判断策略，而不会被转换成虚假的信任结论。

`value_status: PASS` 只表示签名价值报告、哈希和声明的关联关系通过了现有检查。它不证明主张真实，也不证明证据已经足够。最终判断仍由外部审阅者或 Agent 自己负责。

## 非阻断改进项

- CLI 暂未实现常见的 `organchor --version` 参数。审阅者目前可以通过 npm 元数据或已安装软件包的 manifest 确认版本。
- npm 的 `latest` 仍指向 `0.1.0-alpha.1`；Fireseed 审阅者必须使用 `organchor@alpha` 或明确安装 `0.1.0-alpha.4`。这样可以避免预发布版本静默替换当前默认标签。

## 结论

```text
公开自验证：通过
外部 Fireseed 审阅：就绪
稳定 v1：未作此声明
最终信任判断：OrgAnchor 不负责分配
```

本结果支持外部复现、质疑、Agent 兼容性测试和低风险试点。它不授权任何关于认证、背书、证据充分性、生产稳定性或已经实现广泛采用的说法。
