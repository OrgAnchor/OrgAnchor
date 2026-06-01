# OrgAnchor 可见验收指南

Status: Active operator guide.

## 目的

本文件回答一个很具体的问题：当一个组织运行 OrgAnchor 后，非开发者应该如何确认“这套东西确实跑起来了”，而不是只看到一堆 JSON、签名和测试日志。

可见验收不是信任根，不是认证，也不是人工审核替代品。它的作用是把机器可验证链路翻译成人能理解的检查面板，并让采用者亲眼看到：

- 正常发布时，身份链、声明、证据摘要和 Agent 入口如何呈现。
- AI Agent 读取的是哪些机器文件。
- 一旦声明被篡改，验证会如何失败。
- 哪些结论仍然必须交给外部需求方、目录商或审查者自己的策略判断。

## 一条命令验收

运行：

```bash
npm run visible:demo
```

它会创建一个临时采用组织，完成：

```text
root authority -> signed statement -> signed claims/evidence -> value audit -> /verify page -> agent_review -> tamper rejection
```

输出中最重要的文件是：

```text
public/verify/index.html
public/verify/organchor.json
outputs/compact-verify.json
outputs/tamper-compact-verify.json
outputs/visible-acceptance-summary.md
outputs/visible-acceptance-summary.json
```

如果要在浏览器中直接查看页面，运行：

```bash
npm run visible:demo -- --out ./visible-demo --serve
```

脚本会打印类似：

```text
Serving visible acceptance page: http://127.0.0.1:<port>/verify/index.html
```

## 人眼应该看到什么

打开 `/verify/index.html` 后，至少应该能看到这些区域：

- `Agent Verification View`
- `Overall status`
- `Identity status`
- `Value status`
- `Evidence Classes`
- `S1 First-party`
- `S2 Third-party`
- `S3 Sampling`
- `S4 Observation`
- `S5 Challenge`
- `External Policy Route`
- `Trust decision`
- `Next Checks`
- `Key Terms`

这些内容的意义：

- `Overall status`：当前公开包的总体机器验证状态。
- `Identity status`：身份链、声明哈希、签名、根权威是否通过。
- `Value status`：声明和证据层是否存在明显缺口。
- `Evidence Classes`：S1-S5 当前各层证据状态，不把空缺伪装成通过。
- `External Policy Route`：告诉第三方 Agent 下一步应该如何路由，而不是让 OrgAnchor 替外部需求方做最终信任判断。
- `Trust decision`：必须明确显示 `NOT_ASSIGNED_BY_ORGANCHOR` 或同等边界，避免把 OrgAnchor 误解成认证机构。
- `Next Checks`：下一步建议检查项，帮助人和 Agent 继续深入。
- `Key Terms`：把 `Root authority`、`Conformance`、`External Policy Route`、`S1-S5` 等术语解释成人能快速理解的短定义。

## AI Agent 应该读什么

AI Agent 的低阻力路径是：

```bash
organchor verify url <origin> --compact
```

对应机器入口是：

```text
/.well-known/organchor.json
/verify/organchor.json
```

其中 `/verify/organchor.json` 里的 `agent_review` 是人眼页面的同源机器版本。也就是说，人看到的摘要和 Agent 读取的摘要应来自同一套数据，而不是两套互相脱节的解释。

## 篡改失败演示

`npm run visible:demo` 会额外复制一份公开包，并修改已签名的 `official-endpoints.json`。

预期结果：

```text
tamper overall_status = FAIL
tamper identity_status = FAIL
tamper policy_route = STOP_IDENTITY_FAILURE
```

这一步的价值不是“看起来安全”，而是确认一个关键性质：

```text
声明发布后，任何字段被静默修改，都不能继续通过原签名验证。
```

## 验收边界

可见验收能证明：

- OrgAnchor CLI 可以生成身份、声明、证据、页面和 Agent 入口。
- 人眼页面和机器 JSON 暴露同一套核心状态。
- `verify url --compact` 能给 Agent 一个低成本入口。
- 篡改公开声明会导致身份失败。

可见验收不能证明：

- 该组织是好组织。
- 该组织产品真实有效。
- 证据足以满足某个交易、采购、投资、合规或安全策略。
- OrgAnchor 官方为该组织背书。

OrgAnchor 的边界必须始终清楚：它降低发现、验证和理解成本，但最终信任结论属于外部需求方、Agent、目录商、审查者或具体交易策略。

## 语言兼容

OrgAnchor 面向全球，但不应该把不同语言做成不同协议。

推荐原则：

```text
机器协议稳定英文
人类解释支持本地化
翻译不得改变信任语义
```

也就是说：

- JSON 字段名、状态枚举、schema、命令名、文件名保持稳定英文。
- `/verify` 页面、说明文档、术语解释、操作指南可以翻译。
- `PASS`、`FAIL`、`STOP_IDENTITY_FAILURE` 等机器值不要翻译成另一套字段。
- 中文页面可以解释 `PASS` 的含义，但机器 JSON 里仍然写 `PASS`。
- 涉及产品指标、性能承诺、法律/安全/合规含义的翻译，如果会影响决策，应作为可哈希、可签名、可追溯的资料处理。

这样做的理由是：第三方 AI Agent、目录商、验证器和脚本需要一个稳定入口。如果机器字段按语言变化，OrgAnchor 会变成多套互不兼容的标准，反而增加全球采用成本。

当前 Fireseed Alpha 是英文页面优先，中文文档辅助。多语言 `/verify` 页面属于后续应补的产品能力。

## 当前 Fireseed 用法

Fireseed Alpha 阶段，`VISIBLE_ACCEPTANCE.md` 是面向非开发者的第一层验收入口。

推荐顺序：

1. 运行 `npm run visible:demo`，确认本地闭环可跑。
2. 打开 `/verify/index.html`，确认人眼页面不是空壳。
3. 查看 `outputs/compact-verify.json`，确认 Agent 结果为 `PASS`。
4. 查看 `outputs/tamper-compact-verify.json`，确认篡改结果为 `FAIL`。
5. 再进入 `CAPABILITY_TRACEABILITY_MATRIX.md` 和 `CAPABILITY_AUDIT_SCENARIOS.md` 做更深的实现一致性审计。
