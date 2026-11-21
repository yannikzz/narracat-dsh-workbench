---
name: novel-deslop
title: 去 AI 味
summary: 给已写章节去 AI 味的手艺资料：表达、用笔、故事三层怎么查、哪些直接改、哪些先问作者
user-invocable: false
description: 给已写正文去 AI 味的手艺资料：表达（电报体、套词套式、声口、情绪直写、解释）、叙事用笔（详略、关键过程、细节功能、收尾）、故事成立（行为依据、因果、立场、知情顺序）三层怎么诊断、怎么改，哪些能直接改、哪些要先给作者方案。作者说去 AI 味、这章太 AI、读着像机器写的时用。
---

# 去 AI 味

手艺资料在 `${CLAUDE_PLUGIN_ROOT}/skills/novel-deslop/references/`。按作者这次要的范围读下表对应的那份，表外的不预读。

| 这次要做什么 | 读 |
|---|---|
| 没限定范围（「去 AI 味」「这章太 AI 了」） | `${CLAUDE_PLUGIN_ROOT}/skills/novel-deslop/references/expression.md`、`${CLAUDE_PLUGIN_ROOT}/skills/novel-deslop/references/narrative-focus.md`、`${CLAUDE_PLUGIN_ROOT}/skills/novel-deslop/references/story-logic.md`，完整读 |
| 作者只点了某类问题或某段（套词句式、情绪、节奏、对话、收尾、解释与安排感） | `${CLAUDE_PLUGIN_ROOT}/skills/novel-deslop/references/deslop-gates.md`，按它找到对应的方法，只读需要的那几节 |

- 作者只说去 AI 味时按改稿处理：表达与用笔直接改，故事层缺口给出方案，作者同意后再改；作者只要检查时只出诊断、不动正文。正文照改写的方法改（在改写稿上改、改完交提交）。
- 动笔前用 `novel_check_prose_hygiene` 扫这一章：拦稿项要改掉，线索回到语境按功能判断；命中只是定位，零命中不代表用笔与故事没问题。它扫的是正式正文，改完不用自己复扫，提交时宿主按改写稿复扫。
- 每处问题记下原文位置、读起来有什么问题、缺什么依据、最小改法。先看故事成立，再看用笔，最后处理词句；改的是怎么说，不改事件、人物所知与揭露顺序。
- 完成回复按表达、用笔、故事各说改了什么、哪些有效写法保留；故事层没改的缺口逐条写位置、缺什么、最小方案与会牵动的后文。
