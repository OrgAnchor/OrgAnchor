# OrgAnchor Alpha.6 公开发布验收

Status: Historical record. English record 的中文对照；2026-10-18 完成工具发布和公网安装验收，未执行真实根权威迁移。

[英文原记录](./PUBLIC_SELF_VERIFICATION_2026-10-18.md)。

## 发布对应关系

- 版本：`0.1.0-alpha.6`；标签：`v0.1.0-alpha.6`。
- 源代码提交：`cd4995b10a7f68ad9ea1f7bd06214d13c46b617f`。
- 附注标签对象：`d57f133834c0fc7207c30ba9739f6d7f59633530`。
- npm 发布时间：`2026-10-18T16:46:25.085Z`。
- npm 的 `alpha` 指向 Alpha.6；`latest` 仍是历史测试版 Alpha.1，未提升为稳定版。
- [Windows/Linux 质量与安装检查](https://github.com/OrgAnchor/OrgAnchor/actions/runs/39145385949)、[安全检查](https://github.com/OrgAnchor/OrgAnchor/actions/runs/39145386094)、[自动发布](https://github.com/OrgAnchor/OrgAnchor/actions/runs/39145911601)均通过。
- [GitHub 发布页及 schema 附件](https://github.com/OrgAnchor/OrgAnchor/releases/tag/v0.1.0-alpha.6)；[npm 精确版本](https://www.npmjs.com/package/organchor/v/0.1.0-alpha.6)。

最终版本在 Windows、Linux 上各通过 309 项测试，本机完整发布检查也通过。
本机/Windows 的行、函数、分支覆盖率分别为 88.36%、94.12%、61.61%；
Linux 分别为 88.25%、94.12%、61.52%。原有 80%/85%/50% 门槛未降低。
依赖审计和 CodeQL 均通过，没有未关闭的中等及以上 CodeQL 安全告警。

## 下载完整性与来源证明

```text
SHA-512 integrity: sha512-OiYrB4+So37gED6Mpct6ZKBlSUnaHJS3oil8x62+drb4kq3MTgDC8/DFgHRqpAOU77RAZxE6utFHeZCQgquXYg==
SHA-1 shasum: 194ab33ee1cc016129a28d789dd3018091eb1f49
压缩包大小：708220 字节
Rekor 公开日志索引：3313924139
```

实际公网下载文件与 npm 公布的 SHA-512 摘要一致。
干净安装后的 `npm audit signatures` 验证了一个仓库签名和一个来源证明。
[来源证明](https://registry.npmjs.org/-/npm/v1/attestations/organchor@0.1.0-alpha.6)
对应上述提交、标签、仓库、`publish-npm.yml` 工作流及发布运行；其中的文件摘要也一致。

## 实际安装验收

在新的临时目录中，从公网安装精确版本，并禁用安装脚本。
随后仅使用安装下来的 CLI，完成了：

- 帮助命令，以及锁定旧根摘要的官网身份验证。
- 保留旧 v1 记录的原始字节，并继续验证成功。
- 使用一次性测试密钥建立 Ed25519 与 ML-DSA 混合权威，验证旧方授权和完整新方接受签名。
- 确认缺少新方接受签名、剥掉抗量子签名时会失败。
- 生成公开资料包、历史检查点、双方算法签名及封存文件，再验证通过。
- 本地时间证据仍为 `NOT_CHECKED`，没有冒充外部时间证明。

五个 schema 附件包括 v1 权威/签名格式和三个 v2 格式。
它们与 Git 精确提交、npm 安装文件逐字节一致；GitHub 公网下载可解析为 JSON，
也符合附件的 SHA-256 摘要。标准 schema ID 不是在线信任依赖，现有官网在这些地址
可能返回 HTML 回退页，应使用明确发布的 JSON 文件。

## 官网身份没有变化

发布前后，首页、人类验证页、Beacon、验证索引、根权威、官方声明及声明签名
这七处公开文件的原始 SHA-256 均一致，均返回 HTTP 200。

```text
官网权威的规范化摘要：sha256:7d720aa028e4b3b94d47b8e8789b0d7f5c8bb0564e80fac7f0ad7b275718e1b9
根权威原始 SHA-256：ecfe6159c909ffc76e4c89ee95ca60157cff186a4ef3fd1df168d8f58a1c08c4
官方声明原始 SHA-256：764df104432b8fe855c2f36bcbac00a545f4c0e0cecf8736629a19661c3add32
声明签名原始 SHA-256：0a466cfb6516b45c74bc52d5dcce4dee34b0d2307af5c741c3f03655d342c2bc
官网身份验证：PASS
官网签名策略：CLASSICAL_ONLY（仍为传统签名）
```

工具发布没有重新生成自试点资料，没有更换真实密钥，也没有激活迁移。
本次没有提交新的真实 Bitcoin 时间证明或 Arweave 上传。
一次性测试密钥不属于组织的真实根密钥。

## 发布延迟的处理

发布程序在 16:42:16Z 返回成功，仓库实际发布时间为 16:46:25.085Z，约晚四分钟。
此前普通下载地址的 404 响应还被短暂缓存。本次没有重复发布同一版本；
直到普通 npm 安装和下载完整性检查都通过，才将发布判定为完成。

## 仍有的边界

这仍是 Alpha，不是稳定 v1、独立密码学认证、绝对抗量子保证，
也不证明现实主张为真。独立安全审计尚未完成。
下一道需要用户单独确认的关口是真实根权威迁移，不能自动替其他采用者迁移。
