---
name: status
title: 进度
summary: 查看章节完成度、字数与伏笔
description: 查看项目进度 — 章节完成度、字数统计、当前 arc、伏笔追踪
allowed-tools: [Read, Glob, mcp__narracat_memory__novel_get_arc, mcp__narracat_memory__novel_failed_reviews]
permission: read
---

读取项目状态，向用户展示进度报告。

**对作者说话**：你内部用精确的字段 / 文件 / 工具 / agent 名保证引擎正确，但作者会读到的文本（对话叙述、AskUserQuestion 的问题与选项、报告正文）里不出现内部标识——schema 字段名（如 `antagonistic_force`）、立项卡编号（`§5`/`§7`）、文件 / 目录名（`bible/`、`*.md`）、确定度英文枚举（`canon`/`tentative`/`open`）、agent 名（`world-curator` 等）、工程黑话（落盘 / blocking / payoff_beat 等）一律翻成作者词汇，信息全留、黑话全译。对照表见 `${CLAUDE_PLUGIN_ROOT}/docs/contracts/user-facing-language.md`。

## 执行流程

### 步骤 1: 读取数据

- `.narracat/config.yaml` → 书名、题材、语言
- Glob `manuscript/**/ch-*.md` → 已写完的章（有正文即写完；章号看文件名）；规划到第几章看全书大纲
- Glob `.narracat/staging/ch-*.md` → 没有正文、却留着这一章草稿或任务书的，是写到一半停下的章
- `mcp__narracat_memory__novel_get_arc(chapter=最新完成章)` → 当前 arc 信息（无大纲或工具报错时本节显示「未规划」）
- `project_memory_object({kind: "foreshadowing"})` → 伏笔清单与截至最新一章的状态（工具报错时本节显示 N/A）
- `mcp__narracat_memory__novel_failed_reviews()` → 未通过审校的章节清单（`failed_chapters`）

### 步骤 2: 生成报告

## 📖 {书名} — 项目状态

### 进度
- 已完成: {completed}/{planned} 章（{percentage}%）
- 写到一半停下的章: {有 → "第 N 章"；否则 "无"}
- 字数: 作品概览里有总字数与各章字数

### 当前 arc
- {arc 标题}（第 {chapter_start}-{chapter_end} 章）
- 核心问题: {core_question}
- 不可逆变化: {irreversible_change}

### 伏笔追踪（{count} 个）
| 伏笔 | 埋设章 | 目标揭示 | 最新动作 | 状态 |
|---|---|---|---|---|
（来自 project_memory_object；状态由截至最新一章已兑现的动作导出，埋设章取 planted_chapter、最新动作取 last_action_chapter；个数取 truncated.total，没有截断时数清单。target 已临近（≤ 当前章+10）且未 reveal 的行加 ⚠️ 标注）

### 未通过审校的章节
（步骤 1 的 `novel_failed_reviews` 结果 `failed_chapters`；为空时显示「无」）

### 下一步
- 建议: 有写到一半的章就先写完它，否则写最后写完那章的下一章

## 错误处理

| 场景 | 处理 |
|---|---|
| 读不到项目配置文件 | 如实说明这本书的项目文件读不到、本次无法继续；不要自行初始化，也不要建议作者重新建一部 |
| MCP 工具不可用 | 对应小节显示 N/A，其余照常输出 |
