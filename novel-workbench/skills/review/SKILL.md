---
name: review
title: 审修
summary: 检查已写章节里的错误，并给出修改建议
description: 审校已完成章节 — 默认客观错误审校；追加 deep 进入深度标注
argument-hint: <章节号或范围，如"42"、"40-45"、"vol-01"；追加 deep 进入深审>
allowed-tools: [Agent, Read, Write, AskUserQuestion, "mcp__narracat_memory__novel_memory_source", "mcp__narracat_memory__novel_build_writing_context_pack", "mcp__narracat_memory__novel_get_review"]
permission: write
---

对已完成章节做审校。两种模式：

- **模式 A（默认）**：客观错误审校。与写章提交时的审校是同一个 agent、同一套规则，本命令不另加任何审校要求。
- **模式 B（深审）**：作者要深审（说「深审」，或点名时带 `deep`）时触发。纯描述性标注，供人阅读，不评分、不判定、不回流修改。

## 参数解析

- 纯数字 "42" → [42]；范围 "40-45" → 第 40 到 45 章；"vol-01" → 全书大纲里第 1 卷的全部已完成章节。
- 目标章节必须已写完（`manuscript/` 下有这一章的正文），没写完的章节警告并跳过。
- 未提供参数 → AskUserQuestion 询问审校范围；范围超过 20 章 → AskUserQuestion 确认。
- 正文按章号找：`manuscript/` 下某个卷目录里的 `ch-{NNN}.md`（NNN 章号三位补零）。卷目录是写这一章时按大纲放的，之后大纲改了卷范围也不挪，别按归卷拼路径。

审修是只读诊断流程：不回流改稿、不更新进度。

## 模式 A：客观错误审校（默认）

对每个目标章节依次执行：

1. 先调 `novel_memory_source({chapter:N})` 读取实际正文并固定 `source_revision`。再调 `novel_build_writing_context_pack(chapter={N})`，成功则保存路径；收到 `MEMORY_SOURCE_STALE` 时不重试 builder，改用来源工具的实际正文与明确标记过期的 `previous_memory` 做只读差异诊断。现存旧包只有来源版本完全一致才是当前上下文，否则只可明确标为历史对照；没有包也不能自行编造已确立事实。其它错误或来源缺失则记录原因，继续下一章。审校不自动重抽或改写记忆。
2. 派发审校（与写章提交时的审校同一 Envelope，不复述审校规则）：

   ```
   Task(continuity-editor): "审校第 {N} 章。
   正文路径: {manuscript_path}
   source_revision: {本轮实际阅读的正文来源}
   上下文包路径: {pack_path，无法构建时写无}
   上下文用途: {当前上下文 / 已过期历史差异对照 / 无可用上下文}；当前正文以来源工具为准，不能把作者新修改与旧包的差异直接当成错误。"
   ```

3. 调 `novel_get_review(chapter={N})` 取 `{verdict, blockers[]}`。审校报告由工具保存，主会话不写报告文件。

全部章节完成后汇总展示：

| 章 | verdict | blockers |
|---|---|---|

- verdict=fail 的章：逐条列出 blockers，建议改写第 {N} 章修复。
- 全部 pass 且各章有当前完整上下文：报告"审校通过，无客观错误"。使用历史对照或缺少当前上下文的章节须说明只完成了当前文本可证实的检查，并列出尚不能核对的项目；不能把这些限制藏在「全部通过」里。

## 模式 B：深审标注（按需）

深审一律按章落盘，每个目标章节各产一份报告——范围 / 卷输入对范围内每章逐章执行，绝不合并为区间文件。对每个目标章节依次执行：

1. Read 该章正文。深审只基于当前文本做描述性标注，不套用外部写作原则。
2. 通读后写一份纯描述性标注：哪里有力、哪里平、节奏与情绪的观察——逐处给出位置和一句话描述，描述事实而非下结论。
3. 硬规则：无分数、无 verdict、无结构化字段、不写修订指令、不触发任何重写。
4. 写入 `reviews/ch-{NNN}-deep-review.md`（NNN 为该章章号三位补零）。深审报告放在 `reviews/`，供工作台审修视图按章发现并展示；深审不产结构化数据（无 verdict、无路由）。

## 错误处理

| 场景 | 处理 |
|---|---|
| 未提供参数 | AskUserQuestion 询问审校范围 |
| 章节未完成 | 警告并跳过 |
| 上下文包来源过期 | 使用只读来源工具审看当前正文；旧记忆只作历史对照，不更新记忆 |
| 其它上下文包构建错误或正文来源缺失 | 该章标记为无法审校，继续其余章节 |
