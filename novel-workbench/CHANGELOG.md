# Changelog

All notable changes to Narracat · 叙述猫 (`narracat-dsh-workbench`).

## 1.0.10 — 2026-11-22

- 插件关联网站统一为 **https://narracat.com/dsh**：`package.json` 的 `homepage`、市场索引的 `homepage`、bundle README 与仓库 README 的插件入口都指向插件页；npm 页面和 DSH 索引不再落到产品站根路径。
- 补全 GitHub 开源仓库元数据：`repository` 与 `bugs` 指向 `github.com/yannikzz/narracat-dsh-workbench`；仓库内加入 README、LICENSE、CONTRIBUTING、SECURITY、CODE_OF_CONDUCT、架构与发布文档、CI 和 Issue/PR 模板。
- 修正使用指南「线性写作」章节为 1.0.9 的实际行为：一屏一个写章动作、写作等待现场、按书持久化并在切页后恢复、完成后自动加载成稿、右侧面板复用紧凑等待卡；删掉旧的「右上角下一步 / 其他写章按钮」描述。
- 文档、元数据与分发信息补丁；写作流程行为没有变化。
- 回归：396 项，0 失败（macOS；CI 在 Linux 的 Node 20/22 也通过）。

## 1.0.9 — 2026-11-21

- 一个屏幕只留一个写章动作：去掉应用栏的「写下一章 / 写第 N 章」、目录底部的「下一步」、目录头的重复刷新；章节空态或写作等待态出现时，内容工具栏让出写章按钮；追踪空态不再复制刷新 CTA；右侧面板去掉底部重复的「打开完整工作台」和写作看板里重复的「看全部章节」。
- 写作等待态重做：点「写本章 / 改写本章」后，正文页直接变成正在写的现场——宋体「正在写第 N 章」、三点跳动、取资料/写正文/记记忆说明、不确定进度线、已用时、`打开写作会话`；需要作者回答时切琥珀色「去会话回答」，失败时原地显示原因与「再试一次」。
- 等待态正文位置用低对比骨架段落 + 左侧走笔点 + 流光替代空白和灰色禁用按钮；目录里正在写的章节显示「写作中」与呼吸点；应用栏状态药丸用三格均衡器，等待/完成/失败分别用琥珀/绿/红点。
- 写章等待态按书持久化（章节、开始时间、baseline、会话 id）：切换页面 / DSH 会话、刷新或组件重挂载后，等待现场、已用时、目录「写作中」和顶栏药丸都会恢复；如果章节在离开期间写完，回来直接显示正文。旧版本启动、没有章节记录但会话仍在跑的写作，至少显示「写作会话正在运行」药丸和章节页提示，不再只剩一个灰按钮。
- 正文写完后内容区自动展示结果：快照轮询发现新章节/新 mtime 后，当前打开章节的正文页自动加载刚写好的文件（新章和改写都适用），不再停在空白页或旧稿等手动刷新；快照同步也会在手动扫描或外部改稿时更新当前正文。
- 右侧小说面板复用写作等待态：看板与阅读视图在「当前章节正是正在写的章」时显示与工作台一致的紧凑写作卡片（Spark、三点、进度线、骨架正文），工作台启动的写章读取持久化记录，会话里直接发的「写第 N 章」由最后一条用户提示识别；忙碌但与写作无关的回合不显示。
- 所有纯图标按钮统一为 `IconButton`：`aria-label` + `data-tip` CSS tooltip（hover 与键盘 focus 显示），去掉原生 `title`，避免双重 tooltip；书架联系弹窗关闭按钮也接入。tooltip 自动按左右边缘对齐、沿用同一套主题色。
- 分段控件（正文/章纲/审修/记忆，进度/章节摘要/伏笔表/人物状态）选中态去掉黑色 inset 下划线，只保留 surface + 轻阴影。
- 窄容器不再把视图 tab 收成下拉框：任何宽度都保留 tab，工具栏自动换行、tab 横向滚动；640px 下仍可直接切正文/章纲/审修/记忆。
- 样例书恢复为 3 章已写：清理上一次写章遗留的 ch-004 正文/记忆/暂存/提交/上下文包，并重建追踪表，测试、文档与样例口径重新一致。
- 回归：UI 106、Agent 140、API 67、Flow 14、Tracking 20、Bundle 28、Scan 13、Submission 8，合计 396 项，0 失败。

## 1.0.8 — 2026-11-20

- 手稿编辑态重做为「页」：标题从正文第一行拆成页首 26px 宋体可编辑标题，正文不再显示 `#`；页首 kicker 显示字数与未保存/已保存；正文保持 16.5/1.98、38em，`field-sizing: content` 随内容长高，只有页面列滚动，不再有输入框内滚动条。
- 去掉正文与标题的 `:focus-visible` 焦点框：`.nw-root :focus-visible` 的优先级曾压过 `.nw-editor{outline:0}`，编辑区一直被读成一个输入框。
- 编辑工具栏降为 48px，只留「第 3 章 · 编辑中」与取消/完成/保存；编辑中隐藏正文/章纲/审修/记忆四视图 tab。保存留在页内并显示「已保存」，完成或 Esc 保存后回阅读态，取消在脏稿时确认。
- 标题与正文拼回时保留原文件的标题样式（`#` / 无 `#`）和正文空行，只吃掉标题后那一个分隔空行；文件没有标题行时显示「无标题章节」占位，保存不会凭空加标题。
- 书架右上角三个入口统一为同一条文字链接：11px / 0.08em / 24px 间距 / 13px 图标 70% 透明度，hover 变主文字色并出现 1px 下划线；去掉桌面专业版的胶囊边框与 `<a>` 默认下划线，重新扫描补 refresh 图标，≤620px 隐藏桌面专业版。
- 发布准备：`engines.dsh` 收紧为 `>=0.2.2-rc.5 <0.3.0`，补 `homepage`，npm 公开分发。
- 发布前审查修复：提交草稿路径归一化（拒绝 `..`/反斜杠穿越，发布后不再删除正式正文）；保存冲突后的「重新加载」先确认；新建/联系弹窗打开时挂起书架 Enter；`test-scan` 改为真断言；新增 `test-submission`；索引改为 `index.template.json` + 发布后生成，避免先于 npm 托管。
- 门禁 2：Agent 文件写守卫改允许清单（staging/revisions/reviews）并在书解析失败时 fail-closed；contracts 过期工具名修正；轮询 in-flight、快照/文件/保存响应绑定 bookKey+path；≤900 视图切换改下拉；编辑态聚焦 + 焦点标线；text-3/焦点环/分段选中态对比度提升；应用栏写章降 secondary；600px 编辑内边距；toast/kicker 加 aria-live；请求兜底 catch。
- 回归：UI 79、Agent 140、API 67、Flow 14、Tracking 20、Bundle 28、Scan 13、Submission 8，合计 369 项断言，0 失败。

## 1.0.7 — 2026-11-20

- 修复「记忆与状态 → 章节记忆」列表右侧把「2 处状态」挤成竖排、和下一行重叠的问题：`nw-rrow` 的标签和右侧计数不再收缩，计数保持单行右对齐。
- 回归 404 项，0 失败。

## 1.0.6 — 2026-11-20

- 右侧面板不再自带一套迷你 UI：标题区、下一步卡、区块标题、书况统计、章节行、标签、勾选行、正文/章纲阅读和字段全部改用工作台现有的 `nw-ov-*`、`nw-journey`、`nw-section`、`nw-stats3`/`nw-bigstat`、`nw-recent`/`nw-rrow`、`nw-check-row`、`nw-reading`、`nw-field`、`nw-tag`、`nw-btn`、`nw-jsteps`、`nw-bar` 组件类。
- 只保留面板布局、窄栏/宽栏断点与紧凑尺寸覆盖；删掉重复的 `nw-p2-*` 组件样式（审计：0 个未定义、0 个未使用）。
- 全屏宽栏继续居中限宽，标题栏、底部提示与看板左右对齐。
- 回归 404 项，0 失败。

## 1.0.5 — 2026-11-20

- 右侧面板进入全屏/超宽右栏时不再把两栏内容拉满整个窗口：看板最大宽度 1140px 居中，标题栏和底部提示同步对齐；主栏保持可读宽度，资料栏宽 300px。
- 宽栏（≥620px）的「要留意」移回右侧资料栏，和「这本书」统计一起；窄栏仍放在正文现场下方，不丢信息。
- 阅读视图在宽屏下把正文限制在 760px 并居中，避免超宽行长。
- 回归 404 项，0 失败。

## 1.0.4 — 2026-11-20

- 作品概览的长概要不再顶满整页：默认只显示两行，超出时出现「展开全文 / 收起全文」，按需展开；展开后仍与下一张卡的左右边界对齐。
- 概要把「封面 + 标题/进度」和「全书概要」拆成上下两行，概要占满内容宽度，不再从封面右侧缩进，也不再被 `44em` 的行宽限制。
- 修复「全书体检」右侧链接把 `fill(...) + ' · ' + ...` 原样渲染成代码字符串的问题。
- 回归覆盖长概要的展开/收起；自动化检查合计 404 项，0 失败。

## 1.0.3 — 2026-11-20

- 右侧「小说」面板重做为分阶段的工作台看板：立项卡进度与核心钩子、全书骨架/分卷/章纲、开写前的人物与世界准备、正文进度/前情/待处理事项、完本检查与导出；每个阶段都有信息、下一步提示和可直接发给对话的快捷问题。
- 未写章节不再是一块空白：在面板里点开只有章纲的章节，会看到场景、冲突、人物和收束；没有章纲则给出补章纲/直接开写的入口。章节列表改为「写作前线」排序（下一章、最近写、前后章），不再让第 1 章沉在第 10 章后面。
- 面板会自己更新：会话 turn 结束立即刷新；新增轻量 `GET /novel-workbench/api/stamp` 变更指纹（只 stat 文件，不读内容），面板可见时每 4 秒比对一次；没有 stamp 路由时退回 15 秒全量快照轮询。切回页面、窗口获得焦点也会补一次刷新，并显示「已更新 / 同步于」。
- 主工作台记住上一次的页面：按书保存分类、选中的章/人物、章纲/审校/记忆子视图与追踪页签；从 AI 对话切回 Narracat 时直接回到原页，不再先落书架。右侧面板还能一键让完整工作台打开指定章节、人物、大纲或导出。
- 立项到搭骨架的判定收紧：核心立项卡（核心钩子、中心戏剧问题、主角欲望、对抗力量）至少 3 张有内容才进入大纲，不再因为填了一张卡就提示「规划全书大纲」。
- 右栏按容器宽度自适应：窄栏单列、宽栏主栏 + 资料栏；标签、卡片、统计和正文都按容器查询调整，深色主题同步适配。
- 新增回归：主页面按书记忆与恢复、面板 turn-end 刷新、`/stamp` 指纹变化；自动化检查合计 400 项，0 失败。

## 1.0.2 — 2026-11-20

- 修复点击「开始立项」时报错 `cannot get property "remote.session" without inject`：客户端插件现在显式注入 `remote`、`remote.session`、`sessions` 与 `layout`，并在 `dsh.client.inject` 中声明 `@deepseek-ai/dsh-api-remotes`、`@deepseek-ai/dsh-api-session-controller`、`@deepseek-ai/dsh-client-ui-session`。
- 新增 bundle 回归：检查 remote / sessions 注入声明。

## 1.0.1 — 2026-11-20

- 书架版式收紧：书廊宽度固定在 560px 并居中，窗口变宽时书不再被推到两端；舞台最大宽度 1500px。
- 品牌强化：书架顶栏改用 NarraCat 猫与书 Logo（深色主题自动反色），插件图标改为同一品牌图标；新增内嵌 Logo 资源，不增加运行时请求。
- 新增「桌面专业版」引导：书架顶栏直达官网；联系作者弹窗内含 Mac/Windows 专业版下载与官网入口。
- 新增「联系作者」入口：书架顶栏与底部均可打开，弹窗展示 Yannik 简介、GitHub 开源版、小红书与公众号二维码（二维码内嵌，无外部请求）。
- 版本与分发资源同步更新。

## 1.0.0 — 2026-11-20

First production/distribution release.

### Added

- Distribution metadata: publishable package name, MIT license, third-party
  notices, DSH/node engine requirements, changelog, and a packaged install
  story.
- One-image plugin detail page (`docs/DETAIL.md`, `docs/DETAIL.zh.md`,
  `docs/preview.svg`) with expanded localized descriptions.
- Regression coverage for symlink escapes, case-folded protected paths,
  truncated large-file reads, size/time CAS conflicts, YAML-safe config
  writes, multi-book manuscript guards, stale draft/chapter paths, required
  chapter events, min-only word requirements, and the remote Session result
  shape.
- Read-only protection for files larger than the 2 MiB editor cap, with a
  visible explanation instead of a silent truncating save.
- Serialized, fsynced atomic writes and atomic exports.

### Fixed

- A symlinked parent directory could carry a new workbench write outside the
  book; the canonical path is now checked before every read/write.
- Protected paths are matched on the canonical path (case-insensitive on
  macOS/Windows), closing uppercase and symlink-alias bypasses.
- Chapter submissions could publish another chapter's draft; the draft file
  name must now match the submitted chapter.
- Chapter saves now refresh the four tracking sheets (missing import).
- The manuscript guard failed open in multi-book workspaces; it now resolves
  the containing book from the target path.
- Entity proposals lost their proposed type; accepted entities keep it.
- `project_settings_submit` accepted `set`/`append` for characters and
  overwrote their identity; unsupported ops are now rejected.
- Author word requirements with only `min` (e.g. “至少 3000 字”) were ignored;
  they are now checked, and invalid ranges return an issue.
- A failed memory write could still report `saved`; it now returns a partial
  `stopped` result and keeps the draft.
- YAML-unsafe titles/genres/languages could corrupt `config.yaml`; values are
  quoted and language tags validated.
- The client could edit and save a truncated 2 MiB view; it is now read-only
  with a clear notice, and the API rejects a truncated large-file round-trip.
- Session creation accepted only one remote result shape; both the wrapped
  `{ ok, value }` and unwrapped forms are handled.
- The “new writing session” control in the in-conversation 小说 view had no
  handler.
- Snapshot loads could race across books; stale responses are ignored.
- Rewrites were marked done on the first poll because the chapter already had
  text; completion now compares mtime/word count.
- Missing English overview/panel keys, localized relative times, theme token
  typo, and hard-coded Chinese in several workbench views.
- Invalid XML control characters could corrupt exported DOCX files.
- Role prompts and skill copy referenced tools/behaviors that do not exist in
  this version; they now point at the implemented tools.
- Skill catalog file counts were stale.

### Verified

- 368 automated checks across API, agent tools, UI rendering, end-to-end flow,
  tracked memory and bundle integrity (all passing).
