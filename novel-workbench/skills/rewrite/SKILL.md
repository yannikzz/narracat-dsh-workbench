---
name: rewrite
title: 改写
summary: 局部修改或整章重写已写的章节
description: 改写已完成章节 — 在改写稿上局部修改或整章重写，交宿主修订提交程序审校、记进记忆后替换正文，并报出后文仍是旧说法的章
argument-hint: <章节号>（可追加一句改写要求）
allowed-tools: [Agent, Read, Write, Edit, Glob, Grep, AskUserQuestion, project_content_read, project_revision_draft_open, project_writing_status, project_chapter_submit, project_memory_reconcile, project_settings_submit, "mcp__narracat_memory__novel_check_prose_hygiene", "mcp__narracat_memory__novel_build_writing_context_pack"]
permission: write
---

改写一章已经写完的正文。这里只管**怎么改**；改好后调 `project_chapter_submit`，由宿主的修订提交程序依次检查改稿、审校、记进记忆、替换正文。审校与记忆都对改写稿做完之后，宿主才一次性替换正式正文：这期间作品里的正文一字不动，后面各章的记忆与完成进度也不受影响。提交程序只查不改：没过就把问题清单退回给你，修完再提交。

先调 `project_revision_draft_open` 开作者点名那一章的改写稿（上次没发布的会留着接着用），作者这次的要求照原话传进去：它返回改写稿路径、要求记在哪、上次审校报告在哪，以它为准，不自行拼路径。已确认的决定用项目记忆查询取，与作者的对话就在上文。

**对作者说话**：你内部用精确的字段 / 文件 / 工具 / agent 名保证引擎正确，但作者会读到的文本（对话叙述、AskUserQuestion 的问题与选项）里不出现内部标识——schema 字段名、立项卡编号（`§5`/`§7`）、文件 / 目录名（`bible/`、`*.md`）、确定度英文枚举（`canon`/`tentative`/`open`）、agent 名、工程黑话（落盘 / blocking / payoff_beat 等）一律翻成作者词汇，信息全留、黑话全译。对照表见 `${CLAUDE_PLUGIN_ROOT}/docs/contracts/user-facing-language.md`。

## 怎么改

- 先读改写稿与本章章纲，弄清作者要改什么。作者要的是局部改（换一处设定、补一段、改几句对白），就只动相关段落，其余一字不改；要的是整章重写（换人称、换节奏、推翻重来），才整章重写。拿不准时按改动更小的那种理解。
- 改几处自己用 Edit 改；整章重写或大段改默认派写手（上下文干净、带本书的写手人设）：`Task(chapter-writer)` 只给改写稿路径、章纲路径、开改写稿给的申报路径与作者要求原话，写手读改写稿、改完用 Write 整份写回同一路径。作者装了合用的 skill，照 skill 的方法改。
- 改写稿末尾的元数据注释（`<!-- chapter_metadata: … -->`）原样保留。
- 需要前文细节时调 `novel_build_writing_context_pack` 建本章上下文包（它返回的正文路径是正式稿，改写只改开改写稿给的那份），或用 `project_memory_query`、`project_memory_object` 补查（截至上一章，后面章的事这一章还不知道）；包里有 `characters_without_cards` 时逐个按条目上的 `character_uid` 用 `project_memory_object` 补查。
- 作者没说字数时以原章长短为参照：整章写短一半或长一倍，只有作者要的才这样做。
- **只有作者的要求会推翻章纲里承载后续的东西**——伏笔的埋或收、跨章的人物承诺、章末去向、已计划的状态变更——才用 AskUserQuestion 先说清代价（这一拍原本在为哪一章的什么服务、改了什么会落空），再给两条路：**按章纲改**（放弃这条要求，其余照办）/ **按我的要求改**（本章偏离章纲，后文与伏笔可能要跟着调）。写法、节奏、详略、措辞、对白多少都不算冲突，照办。作者点名改的东西（编号、称呼、物件、某句说法）牵连同章里解释它、引用它的句子时，一并改顺，在完成回复里说明改了哪几处，不为此问作者；除上面那种冲突外，改写途中不问剧情或措辞问题。
- 收到 `MEMORY_SOURCE_STALE` 时调 `project_memory_reconcile`（不传参数）：宿主核对作者改过的早章记忆，完成后重建上下文包继续；核对停下时说明卡在哪一章、为什么，停止改写。本章自己的记忆由提交程序入库，不在这里处理。

## 提交

调 `project_chapter_submit`：`chapter` 填本章章号。作者本人明确说了这一章的字数（「改成 2000 字左右」「压到 1500 到 1800 字」）时另填 `word_requirement`：`min` / `max` 取作者说的区间，`author_quote` 逐字引用原话里说字数的那句；作者没说就不填。这次改掉的说法在别的已写章里还没跟上的，填进 `later_chapter_notes`（见完成回复第一条）。

按返回的 `status` 处理：

- **`returned`**：`issues` 逐条是要改的地方（`step: check` 是合规、字数或 AI 腔拦稿项——改写只拦比原稿多出来的，`step: review` 是审校发现）。只改问题涉及的段落，改完再提交；不自己改判问题是否成立。唯一例外：问题只是后面某章还写着作者这次要改掉的旧内容时，不改后文、不发问答卡，结束本轮，在完成回复里说明本章因这处没替换、改写稿还留着，以及第几章仍写着什么，要不要一起改由作者定。`attemptsLeft` 是还能再交几次，用完时宿主会直接问作者。
- **`stopped`**：如实告诉作者停在哪、为什么，不绕过宿主改正文或记忆。`code` 为 `base_changed` 是作者在改写期间改过这一章的正文，改写稿没有替换上去；为 `author_decision` 是作者之前的一条决定挡住了记忆核对，按 `blockedRecords` 说清是哪个人物的哪条记录，并告诉作者作品概览的「待处理」里同时登了这一条，改或撤回后说继续即可。改写稿都还留着：告诉作者「第 {章号} 章有一份没发布的改写稿」，作者说继续就接着提交，说放弃就作废这份改写稿。
- **`saved`**：本章已替换为改写后的正文，进入完成回复。

## 完成回复

用普通回复说明这一章改了什么；不发问答卡，作者要再改会直接说。

- **后文旧说法**：交稿前用 Grep 在后面各章搜这次改掉的旧说法（编号、名字、物件、称呼、某句说法），读命中的段落核实，仍写着旧说法的逐章填进 `later_chapter_notes`；保存后宿主会问作者要不要一起改，你不另问：作者选了一起改就按结果里的 `laterChapters` 接着一章一章改，选了先不改就照实陈述、不替作者动后文。`reminders.laterMentions` 只认名字，是线索，读过相关段落再说。搜过确实没有才说后文不用跟着改，没搜不许这么说。
- 作者这次提的要求逐条对照改后的正文核对：没做到、无法核实或作者选择不执行的如实说，不用「已充分考虑」糊过去。
- 字数按结果里的 `wordCount` 说；`outsideOriginalLength` 或 `outsideAuthorRange` 有值时，用一句话如实说明比原章或作者说的区间差多少。
- `conflictReport` 原样呈现：它是待核对的线索，不是已确认的矛盾，不据此要求作者改稿。`undelivered`、`undeliveredForeshadowing`、`overCeiling`、`majorCandidates`、`editedAfterSave` 有就用作者能懂的话附上，没有不提。

## 错误处理

| 场景 | 处理 |
|---|---|
| 开不出改写稿（这一章还没有正文等） | 照返回的原因告诉作者，停止，不改正式正文 |
| 提交退回 | 按 issues 定点修后再提交 |
| 提交停下 | 如实说明停在哪一步、改写稿还在，停止 |
| 早章记忆待核对且核对停下 | 说明卡在哪一章，停止 |
| NovelMemory 不可用 | 报错并建议检查连接 |
