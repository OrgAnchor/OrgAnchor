# OrgAnchor Alpha.5 公开发布验证

状态：通过，但公开披露证据局限。

验证日期：2026-07-17。

## 发布关联

```text
版本：0.1.0-alpha.5
源代码提交：8ed000cc75f1b1220e2b11a0b40170e0746955b4
注释标签对象：336d31d29664a033e91a81786442e09e8022932e
Git 标签：v0.1.0-alpha.5
GitHub Actions 运行：29561056597（通过）
GitHub 预发布：https://github.com/OrgAnchor/OrgAnchor/releases/tag/v0.1.0-alpha.5
npm 包：organchor@0.1.0-alpha.5
npm 分发标签：alpha -> 0.1.0-alpha.5
```

GitHub 标签工作流检出了准确的发布提交，在干净的 Linux 运行环境安装依赖，通过完整发布门、预览软件包，并通过 npm Trusted Publishing 完成发布。

## 注册表完整性

```text
SHA-512 完整性：sha512-oJxjaI9YvozW3ebEToRl8GEdZZY60/B+QLEcosIZF980lA/9n339yTbSkoPLTrSBuTnU0WaHu1kgrHWzYR5V2w==
SHA-1 摘要：f495adb0521e4d7b2056beb9c1f04b1886fbe217
来源证明类型：https://slsa.dev/provenance/v1
来源证明记录：https://registry.npmjs.org/-/npm/v1/attestations/organchor@0.1.0-alpha.5
```

npm 的 `latest` 标签仍指向历史 Alpha.1。Alpha 用户必须安装 `organchor@alpha`；Alpha.5 不被表述为稳定 v1。

## 全新安装检查

在新的临时工作区中直接从公共 npm 注册表安装软件包。安装结果为 `organchor@0.1.0-alpha.5`，CLI 帮助与验证命令可用，并包含新的 `external_evidence_signatures` Agent 结果界面。

随后使用安装后的 CLI 执行：

```bash
organchor verify url https://organchor.org --brief
```

结果：

```text
overall_status: PASS
identity_status: PASS
conformance_status: FULL_COMPATIBLE
trust_decision: NOT_ASSIGNED_BY_ORGANCHOR
```

## 公开自试点边界

不会仅仅因为软件包版本变化，就重新生成 OrgAnchor 的公开自试点。它经过签名的组织历史是一条独立的连续性记录。

当前线上资料包展示的是第一方证据、人工检查项，并且没有声明外部证据签名路线。因此，Alpha.5 会暴露这些缺口，而不会假装资料包完整性等于证据充分或主张真实。

本次验证证明了发布关联、注册表发布、全新安装、公开入口可访问、身份验证，以及新 Agent 界面的可用性。它不证明：

- OrgAnchor 已经是稳定 v1；
- OrgAnchor 自身的产品主张已经得到独立证实；
- 外部签名有效就等于现实签发方身份或证据内容真实；
- 已保留的 Agent 评估是适用于所有模型的通用基准；
- 任何组织、产品或供应商应当被信任或选中。
