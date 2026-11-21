---
name: novel-web-craft
title: 写章手艺
summary: 写一章的手艺资料：从章纲到正文、情绪落地、对话、开篇、题材卡、本章技法
user-invocable: false
description: 写一章正文的手艺资料：从章纲到正文、场景与疏密、情绪落地、对话、开篇落笔、长篇正文格式、题材正文卡，以及按本章主功能选读的技法（打脸、反转、感情、悬疑、日常装逼）。章节写手写章时用；立项时挑定本书的题材卡也读它的题材卡索引。
---

# 写章手艺

手艺资料在 `${CLAUDE_PLUGIN_ROOT}/skills/novel-web-craft/references/`。写新章或整章重写前按下表读，表外的不预读。

| 什么时候 | 读 |
|---|---|
| 写新正文或整章重写 | `${CLAUDE_PLUGIN_ROOT}/skills/novel-web-craft/references/writing-craft.md`、`${CLAUDE_PLUGIN_ROOT}/skills/novel-web-craft/references/long-format.md` 与 `${CLAUDE_PLUGIN_ROOT}/skills/novel-web-craft/references/writer-execution.md`，完整读 |
| 写第 1–3 章 | `${CLAUDE_PLUGIN_ROOT}/skills/novel-web-craft/references/opening-design.md`，只读「开篇落笔」一节 |
| 本章有对话 | `${CLAUDE_PLUGIN_ROOT}/skills/novel-web-craft/references/dialogue-mastery.md`；示例只示意结构，句子长短与标点按人物和本书说明来 |
| 章纲「读者得到」里有要落到读者身上的情绪 | `${CLAUDE_PLUGIN_ROOT}/skills/novel-web-craft/references/emotion-on-page.md` |
| 题材 | 立项卡定了题材卡（上下文包立项卡扩展里的 `x-题材卡`，主卡在前）就读那几张（`${CLAUDE_PLUGIN_ROOT}/skills/novel-web-craft/references/genre-prose-cards/<卡名>.md`）：主卡完整读，辅卡只摘 1-2 条常见场面或禁止漂移。没定的先读索引 `${CLAUDE_PLUGIN_ROOT}/skills/novel-web-craft/references/genre-prose-cards.md`，按本书题材挑 1 张主卡读；索引里对不上的，读 `${CLAUDE_PLUGIN_ROOT}/skills/novel-web-craft/references/style-genre-modules.md`。卡片只在内部校准题材味，不进正文 |
| 本章技法（至多一份，按这一章的主功能选） | 打脸、逆袭 `${CLAUDE_PLUGIN_ROOT}/skills/novel-web-craft/references/style-combat-face.md`；身份、认知、立场反转 `${CLAUDE_PLUGIN_ROOT}/skills/novel-web-craft/references/long-reversal.md`；感情拉扯 `${CLAUDE_PLUGIN_ROOT}/skills/novel-web-craft/references/long-emotional-methods.md`；悬疑、惊悚、异常线索 `${CLAUDE_PLUGIN_ROOT}/skills/novel-web-craft/references/long-suspense.md`；日常装逼 `${CLAUDE_PLUGIN_ROOT}/skills/novel-web-craft/references/long-chapter-hooks.md`；都对不上就不读 |
