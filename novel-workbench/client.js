// ---- 00-head.js ----
/**
 * Novel workbench — browser half.
 *
 * Generated file. Edit `src/client/*.js` and run `node dev/build-client.mjs`.
 * The page reads `.narracat` projects through the plugin's same-origin API and
 * edits the book's text files in place.
 */

window.__ModuleLoader__.load({
  id: 'narracat-dsh-workbench',
  factory(require) {
    const React = require('react')
    const e = React.createElement
    const { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } = React

    const NS = 'novelWorkbench'
    const API = '/novel-workbench/api/'
    const NOVEL_PANEL_KIND = 'novel-workbench'
    const NOVEL_PANEL_ID = 'narracat-dsh-workbench/panel'

    /** Primary navigation: overview plus the four content categories. */
    const CATEGORIES = [
      { id: 'overview', labelKey: 'category.overview', icon: 'grid' },
      { id: 'manuscript', labelKey: 'category.manuscript', icon: 'file' },
      { id: 'blueprint', labelKey: 'category.blueprint', icon: 'compass' },
      { id: 'settings', labelKey: 'category.settings', icon: 'users' },
      { id: 'materials', labelKey: 'category.materials', icon: 'archive' },
    ]

    /** Generated cover palettes. A book keeps the same one across visits. */
    const COVER_PALETTES = [
      { bg: '#1b2430', ink: '#efe8da', accent: '#a8442f', pattern: 'rain' },
      { bg: '#e9e1d2', ink: '#1c1b18', accent: '#b5813c', pattern: 'sun' },
      { bg: '#394843', ink: '#eee8dc', accent: '#b56a4a', pattern: 'arc' },
      { bg: '#2c2433', ink: '#efe4ea', accent: '#9b4f6b', pattern: 'arc' },
      { bg: '#efe9df', ink: '#26231f', accent: '#7c6a4f', pattern: 'rain' },
      { bg: '#24313a', ink: '#e6edf0', accent: '#4f7c8a', pattern: 'sun' },
    ]

    /** Fine grain, inlined; no external asset. */
    const NOISE = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")"

// ---- 10-copy.js ----
    const zh = {
      panel: 'Narracat · 叙述猫',
      'panel.tabTitle': '小说',
      'panel.openHint': '在右侧打开小说面板（书/章/正文，可直接发提示给对话）',
      'panel.empty': '这个工作区里没有作品目录',
      'panel.openFull': '完整工作台',
      'panel.noChapter': '选一章看正文',
      'panel.promptNext': '写下一章',
      'panel.promptStatus': '本书现状',
      'panel.promptChapter': '本章资料',
      'panel.promptWrite': '写第 {no} 章',
      'panel.askStatus': '这本书现在写到哪了？',
      'panel.askChapter': '把第 {no} 章的章纲、出场人物和记忆摘要整理给我',
      'panel.sendFailed': '发送失败：没有可用的输入框',
      'view.label': '小说',
      'chat.title': '对话',
      'chat.hint': '在下方输入框继续对话',
      'chat.empty': '还没有消息；在下方输入框开始。',
      'chat.you': '你',
      'chat.agent': 'Agent',
      'chat.tool': '工具',
      'chat.streaming': '正在输入…',
      'chat.running': '正在执行',
      'chat.stopped': '已停止',
      'write.action': '写本章',
      'write.next': '写下一章',
      'write.starting': '正在发起…',
      'write.running': '写作进行中 · 第 {no} 章',
      'write.waiting': '等待你回答 · 第 {no} 章',
      'write.done': '第 {no} 章已结束 · 点开查看',
      'write.failed': '发起失败',
      'write.opened': '已开始写第 {no} 章（会话在后台运行）',
      'write.noBook': '还没有选中作品',
      'write.busy': '正在写另一章；线性写作一次只跑一个',
      'write.unavailable': '客户端连不上会话服务',
      'write.noSession': '没能创建写作会话',
      'write.open': '打开写作会话',
      'header.title': 'Narracat · 叙述猫',
      'header.book': '作品',
      'header.refresh': '重新扫描',
      'header.newSession': '新建写作会话',
      'header.newSessionHint': '用「Narracat · 叙述猫」预设开一个新会话',
      'session.unavailable': '还没有连上工作区服务；请刷新页面或重启 DSH 后再试。',
      'session.failed': '新建会话失败',
      'session.noWorkspace': '这个作品所在目录还没有登记为工作区',
      'session.opening': '正在打开…',
      'header.noWorkspace': '没有已登记的工作区',
      'state.loading': '正在读取…',
      'state.scanning': '正在扫描工作区…',
      'state.empty.title': '这个工作区里还没有小说作品',
      'state.empty.body': '这里还没有作品。点「新建作品」从一句话开始；也可以把已有的 Narracat 作品目录放进工作区。',
      'state.error': '读取失败',
      'state.retry': '重试',
      'nav.manuscript': '正文',
      'nav.outline': '大纲',
      'nav.characters': '人物',
      'nav.world': '世界设定',
      'nav.premise': '立项卡',
      'nav.reviews': '审校',
      'nav.memory': '记忆',
      'nav.agents': '本书指令',
      'nav.uncharted': '未分卷',
      'nav.volume': '卷 {no}',
      'nav.emptySection': '这一节还没有内容',
      'chapter': '第 {no} 章',
      'chapter.noText': '这一章还没有正文',
      'chapter.noTextHint': '章纲已在，正文还没有写。点「写本章」，Agent 会取本章资料、写稿并提交。',
      'chapter.openOutline': '查看本章章纲',
      'chapter.words': '{n} 字',
      'chapter.target': '目标 {n} 字',
      'chapter.path': '文件',
      'chapter.volume': '所属卷',
      'chapter.review': '审校',
      'chapter.reviewNone': '未审校',
      'chapter.reviewPass': '通过',
      'chapter.reviewFail': '未通过（{n} 个问题）',
      'action.edit': '编辑',
      'action.read': '阅读',
      'action.save': '保存',
      'action.cancel': '取消',
      'action.saving': '保存中…',
      'action.inspectRaw': '打开原始文件',
      'action.openIdentity': '打开身份卡',
      'action.openOutline': '打开本章章纲',
      'action.openText': '打开本章正文',
      'action.open': '打开',
      'editor.dirty': '有未保存的修改',
      'editor.saved': '已保存',
      'editor.hint': '⌘S / Ctrl+S 保存',
      'editor.reload': '重新加载',
      'aside.detail': '详情',
      'aside.book': '本书状态',
      'aside.title': '书名',
      'aside.genre': '题材',
      'aside.stage': '进度',
      'aside.words': '总字数',
      'aside.next': '下一步',
      'aside.nextChapter': '写第 {no} 章',
      'aside.memory': '记忆库',
      'aside.memoryNone': '还没有记忆库',
      'aside.memorySize': '{size} · 作者决定 {commits} 条',
      'aside.updated': '最近更新',
      'aside.agents': '本书指令',
      'aside.agentsYes': '已有',
      'aside.agentsNo': '未写',
      'aside.identity': '人物身份',
      'aside.portrait': '人物速写',
      'aside.aliases': '别名',
      'aside.state': '初始状态',
      'aside.noIdentity': '还没有身份卡',
      'aside.outline': '本章章纲',
      'aside.beats': '拍',
      'aside.characters': '出场人物',
      'aside.stateChanges': '计划状态变更',
      'aside.foreshadowing': '伏笔',
      'aside.readerGets': '读者得到',
      'aside.chapterEnd': '章末',
      'aside.path': '路径',
      'aside.location': '位置',
      'outline.synopsis': '全书梗概',
      'outline.storylines': '故事线',
      'outline.mysteries': '谜底',
      'outline.foreshadowing': '伏笔登记',
      'outline.volumes': '卷与段',
      'outline.empty': '还没有全书大纲（.narracat/data/outline/outline-structure.json）',
      'outline.stakes': '赌注递增',
      'premise.empty': '还没有立项卡（.narracat/data/bible/premise-cards.json）',
      'premise.certainty.canon': '既定',
      'premise.certainty.tentative': '暂定',
      'premise.certainty.open': '待定',
      'reviews.empty': '还没有审校报告',
      'reviews.fail': '未通过',
      'reviews.pass': '通过',
      'reviews.issues': '{n} 个问题',
      'memory.title': '写作记忆',
      'memory.db': '记忆库文件',
      'memory.none': '这个作品还没有生成记忆库（memory.db）',
      'memory.note': '每章只记本章的变化；人物当前状态与伏笔由读取时折叠现算。正文改过之后，那一章的记忆会标为过期。',
      'memory.commits': '作者决定',
      'memory.records': '已记章数',
      'memory.missing': '还没有记忆的章',
      'memory.stale': '记忆过期的章',
      'memory.list': '章节记忆',
      'memory.fresh': '新鲜',
      'memory.outdated': '过期',
      'memory.wal': '未合并日志',
      'file.truncated': '文件较大，只显示了前 2 MiB',
      'error.generic': '操作失败',
      'path.root': '工作区',
      'path.book': '作品目录',
      'time.never': '—',
    }

    /** English copy. */
    const en = {
      panel: 'Narracat · 叙述猫',
      'panel.tabTitle': 'Novel',
      'panel.openHint': 'Open the novel panel on the right (books, chapters, text; sends prompts to the conversation)',
      'panel.empty': 'No book folder in this workspace',
      'panel.openFull': 'Full workbench',
      'panel.noChapter': 'Pick a chapter to read',
      'panel.promptNext': 'Write next chapter',
      'panel.promptStatus': 'Book status',
      'panel.promptChapter': 'This chapter brief',
      'panel.promptWrite': 'Write chapter {no}',
      'panel.askStatus': 'Where does this book stand now?',
      'panel.askChapter': 'Gather chapter {no}\'s outline, cast and memory summary for me',
      'panel.sendFailed': 'Could not send: no composer available',
      'view.label': 'Novel',
      'chat.title': 'Conversation',
      'chat.hint': 'Continue in the composer below',
      'chat.empty': 'No messages yet; start in the composer below.',
      'chat.you': 'You',
      'chat.agent': 'Agent',
      'chat.tool': 'Tool',
      'chat.streaming': 'Typing…',
      'chat.running': 'Running',
      'chat.stopped': 'Stopped',
      'write.action': 'Write this chapter',
      'write.next': 'Write next chapter',
      'write.starting': 'Starting…',
      'write.running': 'Writing chapter {no}',
      'write.waiting': 'Waiting for your answer · ch. {no}',
      'write.done': 'Chapter {no} finished · open to view',
      'write.failed': 'Could not start',
      'write.opened': 'Started chapter {no} (running in the background)',
      'write.noBook': 'No book selected',
      'write.busy': 'Another chapter is being written; linear writing runs one at a time',
      'write.unavailable': 'The session service is unavailable',
      'write.noSession': 'Could not create a writing session',
      'write.open': 'Open the writing session',
      'header.title': 'Narracat · 叙述猫',
      'header.book': 'Book',
      'header.refresh': 'Rescan',
      'header.newSession': 'New writing session',
      'header.newSessionHint': 'Start a session with the Narracat preset',
      'session.unavailable': 'The workspace service is not connected yet; refresh the page or restart DSH.',
      'session.failed': 'Could not start the session',
      'session.noWorkspace': 'This book folder is not registered as a workspace yet',
      'session.opening': 'Opening…',
      'header.noWorkspace': 'No registered workspace',
      'state.loading': 'Loading…',
      'state.scanning': 'Scanning workspaces…',
      'state.empty.title': 'No novel project in this workspace',
      'state.empty.body': 'No book here yet. Create one from a sentence, or put an existing Narracat book folder into a workspace.',
      'state.error': 'Could not load',
      'state.retry': 'Retry',
      'nav.manuscript': 'Manuscript',
      'nav.outline': 'Outline',
      'nav.characters': 'Characters',
      'nav.world': 'World',
      'nav.premise': 'Premise',
      'nav.reviews': 'Reviews',
      'nav.memory': 'Memory',
      'nav.agents': 'Book instructions',
      'nav.uncharted': 'Uncharted',
      'nav.volume': 'Volume {no}',
      'nav.emptySection': 'Nothing here yet',
      'chapter': 'Chapter {no}',
      'chapter.noText': 'This chapter has no manuscript yet',
      'chapter.noTextHint': 'The outline exists; the text does not. Press “Write this” and the agent gathers the chapter material, writes, and submits.',
      'chapter.openOutline': 'View this chapter’s outline',
      'chapter.words': '{n} words',
      'chapter.target': 'target {n}',
      'chapter.path': 'File',
      'chapter.volume': 'Volume',
      'chapter.review': 'Review',
      'chapter.reviewNone': 'Not reviewed',
      'chapter.reviewPass': 'Pass',
      'chapter.reviewFail': 'Returned ({n} issues)',
      'action.edit': 'Edit',
      'action.read': 'Read',
      'action.save': 'Save',
      'action.cancel': 'Cancel',
      'action.saving': 'Saving…',
      'action.inspectRaw': 'Open raw file',
      'action.openIdentity': 'Open identity card',
      'action.openOutline': 'Open chapter outline',
      'action.openText': 'Open chapter text',
      'action.open': 'Open',
      'editor.dirty': 'Unsaved changes',
      'editor.saved': 'Saved',
      'editor.hint': '⌘S / Ctrl+S to save',
      'editor.reload': 'Reload',
      'aside.detail': 'Details',
      'aside.book': 'Book status',
      'aside.title': 'Title',
      'aside.genre': 'Genre',
      'aside.stage': 'Progress',
      'aside.words': 'Words',
      'aside.next': 'Next',
      'aside.nextChapter': 'Write chapter {no}',
      'aside.memory': 'Memory',
      'aside.memoryNone': 'No memory database yet',
      'aside.memorySize': '{size} · {commits} author decisions',
      'aside.updated': 'Updated',
      'aside.agents': 'Book instructions',
      'aside.agentsYes': 'Present',
      'aside.agentsNo': 'Not written',
      'aside.identity': 'Identity',
      'aside.portrait': 'Portrait',
      'aside.aliases': 'Aliases',
      'aside.state': 'Initial states',
      'aside.noIdentity': 'No identity card yet',
      'aside.outline': 'Chapter outline',
      'aside.beats': 'Beats',
      'aside.characters': 'Cast',
      'aside.stateChanges': 'Planned state changes',
      'aside.foreshadowing': 'Foreshadowing',
      'aside.readerGets': 'Reader gets',
      'aside.chapterEnd': 'Chapter end',
      'aside.path': 'Path',
      'aside.location': 'Location',
      'outline.synopsis': 'Synopsis',
      'outline.storylines': 'Storylines',
      'outline.mysteries': 'Mysteries',
      'outline.foreshadowing': 'Foreshadowing',
      'outline.volumes': 'Volumes and arcs',
      'outline.empty': 'No book-level outline yet (.narracat/data/outline/outline-structure.json)',
      'outline.stakes': 'Stakes progression',
      'premise.empty': 'No premise cards yet (.narracat/data/bible/premise-cards.json)',
      'premise.certainty.canon': 'Canon',
      'premise.certainty.tentative': 'Tentative',
      'premise.certainty.open': 'Open',
      'reviews.empty': 'No review reports yet',
      'reviews.fail': 'Returned',
      'reviews.pass': 'Pass',
      'reviews.issues': '{n} issues',
      'memory.title': 'Writing memory',
      'memory.db': 'Memory database',
      'memory.none': 'This book has no memory database (memory.db) yet',
      'memory.note': 'Each chapter records only its own changes; current states and foreshadowing are folded at read time. Editing prose marks that chapter’s memory stale.',
      'memory.commits': 'Author decisions',
      'memory.records': 'Recorded chapters',
      'memory.missing': 'Chapters without memory',
      'memory.stale': 'Stale chapters',
      'memory.list': 'Chapter memory',
      'memory.fresh': 'Fresh',
      'memory.outdated': 'Stale',
      'memory.wal': 'Unmerged log',
      'file.truncated': 'Large file: only the first 2 MiB is shown',
      'error.generic': 'The operation failed',
      'path.root': 'Workspace',
      'path.book': 'Book',
      'time.never': '—',
    }

// ---- 12-logo.js ----
    /**
     * NarraCat mark, embedded so the client bundle needs no extra asset request.
     * Source artwork: the NarraCat website (nm-logo.png), trimmed and resized.
     */
    const NARRACAT_LOGO = 'data:image/png;base64,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CfE0YsQwmjp1irJ48fl7VhSteO2hhx46r66ubjoRxYTm0fPz8wUjoIZfi5Go9xZ279599fnnn9dstpgJAKQAsFUANkebjLJu3bqb1WwrW7NmjZifn69PMQvhcg3qxJN+3doDxcXF3O12F6jBnYiKIz777LPCN99+891ly65+6pJLLvn4pJNmfpWbO7p62LBsf58+mZSYmEAWSyfm8EOgcUICADKZRUpOTqIxY3PpjDNOr7v99ts/evf9d+8iogKjyuLS0lLhl9421VtmDfEWBl999VUfqnjEfi4gsYA0kAFAGjMmlz744IPnNeyi0A7sHkAoRoeCfKC+xMnr9aYjItpstn26sicEAHjllVeyNmzYcM233367s2/fDO/E8ZOwvqFhy/nnn78nIyMDo6Ki9tvtdnC73WCxWODw4cO25557blB5eXkGAM3q6OiYUr1/f2KL251Yf7geGhsbwevxAlGQKRAARMYQkpKSICsrC/r161sxblzehlNPPe0/6enpbwuC0CTLsh7bFwoLC5X/T7tBCwGXlZWxsrIyUKufFX1zSX5+Prviiiuou3slIiwpKWFnn322TETskUceeu2B+x88Y29VlcQEJiiSApwzkmVFGpo9VLz+umuf93p9n23bvo3v3L5THjp08EhBMCWaTKbDCxcu/NOoUaMOhNoDRCQcOHDAlJaW1hou0pfq8XhGhXClAAAwevTo+61WC5lMIkVFOSgpKYGSkhJp4MABNGZMLp1wQs6uM844/fu5c+e8uHz5bY8/+eST123btu1kIspNSEiApKQkSEhIACJKe+6F5xZffvmlq0877dT1M2ZM78jOHkrRMS5iR9qr2jUEMacrikbnjqaFCxcceOKJJ97dvXvXpUSUERpr+DlVBBEx1SLvIokEQQAislqtVjCbzWBQGsa6k66at2C32+GOO1bdosLn+TX4OtUukKOiHJSYmEAuVxTZ7FYymQUCBIpy2unMM8+83ajSuK6uLkqr2A4ajHoJUO+tT3dwh91isWwvoiK2ClcpKgNIAwb0X71n754/yJIi6UqauvTAM45gNpvAbndAQnwCpKQkA2N8f9++ffelpCR/Nnbs2F3z5p32OQBs6devn1RZWRm7Y8eO0evXry8sLy8bWFm5e2xtbW1UXV0dtLa2gQ7X12y1WiBr0CAYN3ase8qUyf9cvPjCvwHAel0F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'

// ---- 13-contact.js ----
    /**
     * Author contact material, embedded so the popup needs no extra request.
     * Source: the NarraCat website public/ social and avatar assets.
     */
    const AUTHOR_GITHUB = 'https://github.com/yannikzz/narracat-novel-agent'
    const NARRACAT_SITE = 'https://narracat.com'
    const NARRACAT_DOWNLOAD_MAC = 'https://pro-update.narracat.com/mac-arm64/latest.dmg'
    const NARRACAT_DOWNLOAD_WIN = 'https://pro-update.narracat.com/win-x64/latest.exe'
    const AUTHOR_AVATAR = 'data:image/jpeg;base64,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'
    const AUTHOR_QR_XHS = 'data:image/png;base64,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'
    const AUTHOR_QR_WECHAT = 'data:image/png;base64,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'

// ---- 15-copy-extra.js ----
    /** Additional copy for the shelf, workbench shell, and content views. */
    Object.assign(zh, {
      'nav.overview': '概览',
      'nav.blueprint': '构思',
      'nav.settings': '设定',
      'nav.materials': '资料',
      'category.overview': '概览',
      'category.manuscript': '书稿',
      'category.blueprint': '构思',
      'category.settings': '设定',
      'category.materials': '资料',
      'brand.name': 'Narracat · 叙述猫',
      'brand.upper': 'NARRACAT · 叙述猫',
      'panel': 'Narracat · 叙述猫',
      'header.title': 'Narracat · 叙述猫',
      'header.newSessionHint': '用「Narracat · 叙述猫」预设开一个新会话',
      'view.label': '叙述猫',
      'panel.tabTitle': '叙述猫',
      'shelf.library': '书架 / LIBRARY',
      'shelf.continue': '继续写第 {no} 章',
      'shelf.open': '打开作品',
      'shelf.rescan': '重新扫描',
      'shelf.empty.title': '空书架',
      'shelf.empty.body': '在 DSH 工作区里放入一个 Narracat 作品目录。作品不会被复制或改动。',
      'shelf.empty.hint': '需要目录里有 .narracat/config.yaml',
      'shelf.loading': '正在读取书架',
      'shelf.error': '书架读取失败',
      'shelf.switchHint': '← → 切换 · 共 {n} 本',
      'shelf.index': '全部作品',
      'shelf.openWorkbench': '打开工作台',
      'shelf.noSynopsis': '还没有梗概；打开工作台继续写。',
      'workbench.shelf': '书架',
      'workbench.overview': '作品概览',
      'workbench.newSession': '新建写作会话',
      'workbench.writeNext': '写下一章',
      'workbench.writing': '写作中 · 第 {no} 章',
      'workbench.writingUnknown': '写作会话正在运行',
      'workbench.waiting': '等你回答 · 第 {no} 章',
      'workbench.done': '第 {no} 章已完成',
      'workbench.failed': '发起失败',
      'workbench.saved': '已保存',
      'workbench.unsaved': '未保存',
      'workbench.saving': '保存中…',
      'workbench.save': '保存',
      'workbench.cancel': '取消',
      'workbench.edit': '编辑',
      'workbench.editing': '编辑中',
      'workbench.finish': '完成',
      'workbench.untitled': '无标题章节',
      'workbench.reload': '重新加载',
      'workbench.more': '更多',
      'workbench.readonly': '只读',
      'workbench.search': '查找…',
      'workbench.nextStep': '下一步：写第 {no} 章',
      'workbench.nextStepLabel': '下一步：{label}',
      'workbench.noContent': '从左侧打开内容',
      'workbench.directory': '目录',
      'workbench.view': '视图',
      'workbench.noBook': '没有打开作品',
      'workbench.back': '返回书架',
      'workbench.context': '资料',
      'workbench.contextPanel': '资料栏',
      'workbench.chat': '对话',
      'workbench.close': '收起',
      'workbench.openFirst': '从左侧选择一章、一个人物，或一份设定。',
      'workbench.discard.title': '有未保存的修改',
      'workbench.discard.body': '离开这一篇会丢掉还没保存的文字。',
      'workbench.discard.keep': '继续编辑',
      'workbench.discard.leave': '放弃修改',
      'workbench.words': '{n} 字',
      'workbench.chapterNo': '第 {no} 章',
      'workbench.volume': '第 {no} 卷',
      'workbench.loose': '未分卷',
      'workbench.chapters': '{n} 章',
      'workbench.settingsCount': '{n} 项',
      'workbench.chapterUnit': '章',
      'workbench.wordUnit': '字',
      'workbench.people': '人物',
      'workbench.world': '世界设定',
      'workbench.other': '其他设定',
      'workbench.instructions': '本书指令',
      'workbench.memory': '写作记忆',
      'contact.entry': '联系作者',
      'contact.proEntry': '桌面专业版',
      'contact.proTitle': '想要更完整的长篇创作流水线？',
      'contact.proBody': 'NarraCat 桌面专业版提供对话协作、故事记忆、写作偏好、文风对比、角色闲聊与短剧创作。',
      'contact.proReq': '公开内测 · Windows 10/11（64 位）· Apple 芯片 Mac（macOS 12+）；内测期间软件免费，模型服务需自备 API Key，费用另计。',
      'contact.downloadMac': '下载 Mac 专业版',
      'contact.downloadWin': '下载 Windows 专业版',
      'contact.visitSite': '访问官网',

      'contact.title': '联系作者',
      'contact.role': '10 年产品人 · 勇闯 Vibe Coding',
      'contact.bio': '把自己用 AI 做的产品和思考摊开来分享。在 AI 浪潮里保持学习、保持判断，和优秀的人一起共勉。',
      'contact.github': 'GitHub 开源版',
      'contact.xhs': '小红书',
      'contact.wechat': '公众号',
      'contact.scan': '扫码关注',
      'contact.hint': '扫码关注作者，或到 GitHub 看 NarraCat 开源版。',
      'contact.foot': '故事生于人，成于智能。',
      'contact.close': '关闭',
      'contact.avatarAlt': 'Yannik 的头像',
      'contact.qrAltXhs': '小红书二维码',
      'contact.qrAltWechat': '公众号二维码',

      'time.justNow': '刚刚',
      'time.minutes': '分钟前',
      'time.hours': '小时前',
      'workbench.reviews': '审校报告',
      'workbench.references': '参考',
      'workbench.book': '本书',
      'workbench.outline': '全书大纲',
      'workbench.premise': '立项卡',
      'overview.progress': '已写 {done} 章 · 计划 {total} 章',
      'overview.expand': '展开全文',
      'overview.collapse': '收起全文',
      'overview.written': '已写章节',
      'overview.words': '总字数',
      'overview.memory': '记忆覆盖',
      'overview.reviews': '审校未过',
      'overview.next': '下一步',
      'overview.recent': '最近章节',
      'overview.info': '本书信息',
      'overview.continue': '继续写第 {no} 章',
      'overview.openChapter': '打开第 {no} 章',
      'overview.write': '写本章',
      'overview.memoryMissing': '{n} 章未记',
      'overview.memoryTitle': '记忆与状态',
      'overview.tabForeshadowing': '伏笔',
      'overview.tabStates': '状态',
      'overview.tabMemory': '章节记忆',
      'overview.noForeshadowing': '还没有伏笔登记或伏笔动作。',
      'overview.noStates': '还没有状态变化。',
      'overview.noMemory': '还没有章节记忆。',
      'overview.plantedCh': '第 {no} 章埋',
      'overview.revealTarget': '计划第 {no} 章兑现',
      'overview.revealVolume': '计划第 {no} 卷兑现',
      'overview.lastTouched': '最近第 {no} 章',
      'overview.stateCount': '{n} 处状态',
      'overview.statusPlanned': '未埋',
      'overview.statusPlanted': '已埋',
      'overview.statusDeveloping': '推进中',
      'overview.statusRevealed': '已揭晓',
      'overview.typeSmall': '段内',
      'overview.typeMedium': '卷内',
      'overview.typeMajor': '跨卷',
      'overview.items': '{n} 项',
      'chapter.events': '事件',
      'overview.reviewFailed': '{n} 章未过',
      'overview.path': '作品路径',
      'overview.target': '每章目标',
      'overview.instructions': '本书指令',
      'overview.updated': '最近更新',
      'overview.hasInstructions': '已有 AGENTS.md',
      'overview.noInstructions': '还没写',
      'chapter.text': '正文',
      'chapter.outline': '章纲',
      'chapter.review': '审修',
      'chapter.memory': '记忆',
      'chapter.title': '章节标题',
      'chapter.noText': '这一章还没有正文',
      'chapter.noTextHint': '章纲已在，正文还没有写。',
      'chapter.openOutline': '查看本章章纲',
      'chapter.noOutline': '还没有这一章的章纲',
      'chapter.noReview': '还没有这一章的审校报告',
      'chapter.noMemory': '还没有这一章的记忆',
      'chapter.memoryStale': '记忆已过期',
      'chapter.memoryFresh': '记忆新鲜',
      'chapter.beats': '拍',
      'chapter.cast': '出场人物',
      'chapter.stateChanges': '计划状态变更',
      'chapter.foreshadowing': '伏笔',
      'chapter.readerGets': '读者得到',
      'chapter.chapterEnd': '章末',
      'chapter.pov': '视角',
      'chapter.opening': '开场',
      'chapter.whatChanges': '本章改变',
      'chapter.want': '主角想要',
      'chapter.obstacle': '阻碍',
      'chapter.stakes': '风险',
      'chapter.mustKnow': '读者必须知道',
      'chapter.heldBack': '留到以后',
      'chapter.valueShift': '价值转变',
      'chapter.emotionalStakes': '情感赌注',
      'chapter.dramaticFocus': '戏剧焦点',
      'chapter.storylineFocus': '故事线',
      'chapter.scenes': '场景',
      'chapter.outlineGist': '章纲要点',
      'reviews.emptyBody': '写完一章后，审校结论会出现在这里。',
      'chapter.pressurePoint': '压力点',
      'chapter.endingNote': '章末',
      'character.profile': '档案',
      'character.state': '近况',
      'character.stage': '阶段',
      'character.aliases': '别名',
      'character.gender': '性别',
      'character.age': '年龄',
      'character.initial': '初始状态',
      'character.current': '当前状态',
      'character.portrait': '速写',
      'character.identity': '身份卡',
      'character.related': '相关章节',
      'panel.chapter': '本章资料',
      'panel.book': '本书资料',
      'panel.character': '人物资料',
      'panel.file': '文件信息',
      'panel.path': '路径',
      'panel.size': '大小',
      'panel.noMemory': '还没有本章记忆。写完后由提交程序记录；手改正文后需核对。',
      'panel.memoryNote': '手改正文后记忆会标为过期。',
      'panel.current': '当前',
      'panel.initial': '初始',
      'panel.sections': '资料',
      'shelf.status.writing': '写作中',
      'shelf.status.empty': '未开写',
      'shelf.status.done': '已完结',
    })

    Object.assign(en, {
      'nav.overview': 'Overview',
      'nav.blueprint': 'Blueprint',
      'nav.settings': 'Settings',
      'nav.materials': 'Materials',
      'category.overview': 'Overview',
      'category.manuscript': 'Manuscript',
      'category.blueprint': 'Blueprint',
      'category.settings': 'Settings',
      'category.materials': 'Materials',
      'brand.name': 'Narracat · 叙述猫',
      'brand.upper': 'NARRACAT · 叙述猫',
      'panel': 'Narracat · 叙述猫',
      'header.title': 'Narracat · 叙述猫',
      'header.newSessionHint': 'Start a session with the Narracat preset',
      'view.label': 'Narracat',
      'panel.tabTitle': 'Narracat',
      'shelf.library': 'LIBRARY',
      'shelf.continue': 'Continue chapter {no}',
      'shelf.open': 'Open book',
      'shelf.rescan': 'Rescan',
      'shelf.empty.title': 'Empty shelf',
      'shelf.empty.body': 'Put a Narracat book folder inside a DSH workspace. Nothing is copied or changed.',
      'shelf.empty.hint': 'Requires .narracat/config.yaml',
      'shelf.loading': 'Reading the shelf',
      'shelf.error': 'Could not read the shelf',
      'shelf.switchHint': '← → to switch · {n} books',
      'shelf.index': 'All books',
      'shelf.openWorkbench': 'Open workbench',
      'shelf.noSynopsis': 'No synopsis yet; open the workbench to keep writing.',
      'workbench.shelf': 'Shelf',
      'workbench.overview': 'Overview',
      'workbench.newSession': 'New writing session',
      'workbench.writeNext': 'Write next',
      'workbench.writing': 'Writing chapter {no}',
      'workbench.writingUnknown': 'A writing session is running',
      'workbench.waiting': 'Waiting · chapter {no}',
      'workbench.done': 'Chapter {no} done',
      'workbench.failed': 'Could not start',
      'workbench.saved': 'Saved',
      'workbench.unsaved': 'Unsaved',
      'workbench.saving': 'Saving…',
      'workbench.save': 'Save',
      'workbench.cancel': 'Cancel',
      'workbench.edit': 'Edit',
      'workbench.editing': 'Editing',
      'workbench.finish': 'Done',
      'workbench.untitled': 'Untitled chapter',
      'workbench.reload': 'Reload',
      'workbench.more': 'More',
      'workbench.readonly': 'Read-only',
      'workbench.search': 'Find…',
      'workbench.nextStep': 'Next: write chapter {no}',
      'workbench.nextStepLabel': 'Next: {label}',
      'workbench.noContent': 'Open something from the left',
      'workbench.directory': 'Directory',
      'workbench.view': 'View',
      'workbench.noBook': 'No book open',
      'workbench.back': 'Back to shelf',
      'workbench.context': 'Context',
      'workbench.contextPanel': 'Context panel',
      'workbench.chat': 'Chat',
      'workbench.close': 'Collapse',
      'workbench.openFirst': 'Pick a chapter, character, or setting on the left.',
      'workbench.discard.title': 'Unsaved changes',
      'workbench.discard.body': 'Leaving this file will discard the unsaved text.',
      'workbench.discard.keep': 'Keep editing',
      'workbench.discard.leave': 'Discard',
      'workbench.words': '{n} words',
      'workbench.chapterNo': 'Chapter {no}',
      'workbench.volume': 'Volume {no}',
      'workbench.loose': 'Uncharted',
      'workbench.chapters': '{n} chapters',
      'workbench.settingsCount': '{n} items',
      'workbench.chapterUnit': 'ch.',
      'workbench.wordUnit': 'words',
      'workbench.people': 'Characters',
      'workbench.world': 'World',
      'workbench.other': 'Other settings',
      'workbench.instructions': 'Book instructions',
      'workbench.memory': 'Writing memory',
      'contact.entry': 'Contact author',
      'contact.proEntry': 'Desktop Pro',
      'contact.proTitle': 'Want the full long-form writing pipeline?',
      'contact.proBody': 'NarraCat Desktop Pro adds dialogue collaboration, story memory, writing preferences, style comparison, character chat and short-drama writing.',
      'contact.proReq': 'Public beta · Windows 10/11 (64-bit) · Apple-silicon Mac (macOS 12+). The app is free during the beta; model service requires your own API key and is billed separately.',
      'contact.downloadMac': 'Download for Mac',
      'contact.downloadWin': 'Download for Windows',
      'contact.visitSite': 'Visit website',

      'contact.title': 'Contact the author',
      'contact.role': '10-year product person · vibe coding',
      'contact.bio': 'I share the products and thinking I build with AI — staying curious, staying judgmental, and learning alongside good people.',
      'contact.github': 'GitHub · open source',
      'contact.xhs': 'Xiaohongshu',
      'contact.wechat': 'WeChat',
      'contact.scan': 'Scan to follow',
      'contact.hint': 'Scan to follow the author, or find the NarraCat open-source version on GitHub.',
      'contact.foot': 'Stories are born from people, completed with intelligence.',
      'contact.close': 'Close',
      'contact.avatarAlt': "Yannik's avatar",
      'contact.qrAltXhs': 'Xiaohongshu QR code',
      'contact.qrAltWechat': 'WeChat Official Account QR code',

      'time.justNow': 'just now',
      'time.minutes': 'min ago',
      'time.hours': 'h ago',
      'workbench.reviews': 'Reviews',
      'workbench.references': 'References',
      'workbench.book': 'Book',
      'workbench.outline': 'Outline',
      'workbench.premise': 'Premise',
      'overview.progress': '{done} of {total} chapters written',
      'overview.expand': 'Show more',
      'overview.collapse': 'Show less',
      'overview.written': 'Written',
      'overview.words': 'Words',
      'overview.memory': 'Memory',
      'overview.reviews': 'Reviews',
      'overview.next': 'Next',
      'overview.recent': 'Recent chapters',
      'overview.info': 'Book info',
      'overview.continue': 'Continue chapter {no}',
      'overview.openChapter': 'Open chapter {no}',
      'overview.write': 'Write this',
      'overview.memoryMissing': '{n} missing',
      'overview.memoryTitle': 'Memory & state',
      'overview.tabForeshadowing': 'Threads',
      'overview.tabStates': 'States',
      'overview.tabMemory': 'Chapter memory',
      'overview.noForeshadowing': 'No foreshadowing registered or moved yet.',
      'overview.noStates': 'No state changes yet.',
      'overview.noMemory': 'No chapter memory yet.',
      'overview.plantedCh': 'Planted ch. {no}',
      'overview.revealTarget': 'Planned reveal ch. {no}',
      'overview.revealVolume': 'Planned reveal vol. {no}',
      'overview.lastTouched': 'Last ch. {no}',
      'overview.stateCount': '{n} state changes',
      'overview.statusPlanned': 'Not planted',
      'overview.statusPlanted': 'Planted',
      'overview.statusDeveloping': 'Developing',
      'overview.statusRevealed': 'Revealed',
      'overview.typeSmall': 'In-scene',
      'overview.typeMedium': 'In-volume',
      'overview.typeMajor': 'Cross-volume',
      'overview.items': '{n} items',
      'chapter.events': 'Events',
      'overview.reviewFailed': '{n} returned',
      'overview.path': 'Path',
      'overview.target': 'Target',
      'overview.instructions': 'Instructions',
      'overview.updated': 'Updated',
      'overview.hasInstructions': 'AGENTS.md present',
      'overview.noInstructions': 'Not written',
      'chapter.text': 'Text',
      'chapter.outline': 'Outline',
      'chapter.review': 'Review',
      'chapter.memory': 'Memory',
      'chapter.title': 'Chapter title',
      'chapter.noText': 'This chapter has no text yet',
      'chapter.noTextHint': 'The outline exists; the text does not.',
      'chapter.openOutline': 'View chapter outline',
      'chapter.noOutline': 'No chapter outline yet',
      'chapter.noReview': 'No review yet',
      'chapter.noMemory': 'No chapter memory yet',
      'chapter.memoryStale': 'Memory is stale',
      'chapter.memoryFresh': 'Memory is fresh',
      'chapter.beats': 'Beats',
      'chapter.cast': 'Cast',
      'chapter.stateChanges': 'Planned state changes',
      'chapter.foreshadowing': 'Foreshadowing',
      'chapter.readerGets': 'Reader gets',
      'chapter.chapterEnd': 'Chapter end',
      'chapter.pov': 'POV',
      'chapter.opening': 'Opening',
      'chapter.whatChanges': 'What changes',
      'chapter.want': 'Protagonist wants',
      'chapter.obstacle': 'Obstacle',
      'chapter.stakes': 'At stake',
      'chapter.mustKnow': 'Reader must know',
      'chapter.heldBack': 'Held back',
      'chapter.valueShift': 'Value shift',
      'chapter.emotionalStakes': 'Emotional stakes',
      'chapter.dramaticFocus': 'Dramatic focus',
      'chapter.storylineFocus': 'Storyline',
      'chapter.scenes': 'Scenes',
      'chapter.outlineGist': 'Outline gist',
      'reviews.emptyBody': 'Review findings appear here after a chapter is written.',
      'chapter.pressurePoint': 'Pressure point',
      'chapter.endingNote': 'Ending note',
      'character.profile': 'Profile',
      'character.state': 'Now',
      'character.stage': 'Stage',
      'character.aliases': 'Aliases',
      'character.gender': 'Gender',
      'character.age': 'Age',
      'character.initial': 'Initial states',
      'character.current': 'Current states',
      'character.portrait': 'Portrait',
      'character.identity': 'Identity card',
      'character.related': 'Chapters',
      'panel.chapter': 'Chapter context',
      'panel.book': 'Book context',
      'panel.character': 'Character context',
      'panel.file': 'File',
      'panel.path': 'Path',
      'panel.size': 'Size',
      'panel.noMemory': 'No memory yet. The submitter records it after writing; re-check after manual edits.',
      'panel.memoryNote': 'Manual edits mark the memory stale.',
      'panel.current': 'Current',
      'panel.initial': 'Initial',
      'panel.sections': 'Context',
      'shelf.status.writing': 'Writing',
      'shelf.status.empty': 'Not started',
      'shelf.status.done': 'Complete',
    })

    Object.assign(zh, {
      'shelf.newBook': '新建作品',
      'shelf.empty.title': '还没有作品',
      'shelf.empty.body': '从一句话开始，建立第一本书。Agent 会陪你立项、搭骨架、写正文，直到导出成稿。',
      'shelf.empty.hint': '作品会保存成一个独立文件夹，并加入左侧工作区。',
      'create.title': '新建作品',
      'create.lead': '一句话就够。剩下的，Agent 会陪你慢慢想。',
      'create.name': '书名',
      'create.nameHint': '例如：雨港来信',
      'create.genre': '题材',
      'create.genreHint': '悬疑 / 奇幻 / 言情 / 武侠…',
      'create.optional': '可不填',
      'create.idea': '一句话想法',
      'create.ideaHint': '例如：一个搬工收到一封没有署名的信。',
      'create.chapters': '计划章数',
      'create.words': '每章字数',
      'create.location': '保存位置',
      'create.defaultLocation': '默认位置',
      'create.changeLocation': '更改',
      'create.submit': '建立作品',
      'create.creating': '正在建立…',
      'create.cancel': '取消',
      'create.required': '先给作品起个名字。',
      'create.failed': '新建失败',
      'create.done': '《{title}》已经建好。下一步：开始立项。',
      'create.hint': '建好后不会自动调用模型；你可以先看看工作台，再开始立项。',
      'journey.next': '下一步',
      'journey.health': '全书体检',
      'journey.healthGood': '目前没有明显的坑。',
      'journey.healthMore': '还有 {n} 项',
      'journey.progress': '已写 {done} 章 · 计划 {total} 章',
      'journey.export': '导出成稿',
      'journey.finish': '完本并导出',
      'journey.checking': '正在看…',
      'overview.export': '导出成稿',
      'overview.finish': '完本并导出',
      'export.title': '导出成稿',
      'export.lead': '导出不会改动作品。交稿前可以顺手看一眼体检。',
      'export.format': '格式',
      'export.docx': 'Word（.docx）',
      'export.html': 'HTML（可打印成 PDF）',
      'export.md': 'Markdown',
      'export.txt': '纯文本',
      'export.button': '导出',
      'export.working': '正在导出…',
      'export.done': '已导出 {chapters} 章 · {words} 字',
      'export.download': '下载 {name}',
      'export.path': '已保存到 {path}',
      'export.again': '再导一份',
      'export.close': '关闭',
      'export.noText': '还没有正文，先写第一章。',
      'export.failed': '导出失败',
      'export.checkTitle': '交稿前看一眼',
      'export.checkClean': '没有发现明显的坑。',
      'export.detail': '查看',
      'health.good': '好',
      'health.warn': '待处理',
      'health.info': '提示',
      'chapter.rewrite': '改写本章',
      'chapter.continue': '继续写本章',
      'chapter.write': '写本章',
      'chapter.noOutlineWrite': '先补章纲',
      'chapter.writingTitle': '正在写第 {no} 章',
      'chapter.rewritingTitle': '正在改写第 {no} 章',
      'chapter.writingStarting': '正在准备写作会话…',
      'chapter.writingElapsed': '已用时 {time}',
      'chapter.writingAside': '可以先去做别的。',
      'chapter.writingHint': 'Agent 会取本章资料、写正文、检查并记下本章记忆；完成后这一页会自动更新。',
      'chapter.writingEditHint': 'Agent 在改写稿里工作，正式正文不会被动；改完去会话里看改写稿。',
      'chapter.writingWaiting': '等你回答',
      'chapter.writingWaitingHint': 'Agent 需要你先确认一件事。去写作会话里回答后，它会接着写。',
      'chapter.writingAnswer': '去会话回答',
      'chapter.writingOpen': '打开写作会话',
      'chapter.writingError': '这次没有写成',
      'chapter.writingErrorHint': '没有检测到新正文。可以再试一次。',
      'chapter.writingRetry': '再试一次',
      'write.writingShort': '写作中',
      'workbench.tracking': '全书追踪',
      'tracking.progress': '进度',
      'tracking.summaries': '章节摘要',
      'tracking.foreshadowing': '伏笔表',
      'tracking.characters': '人物状态',
      'tracking.memo': '写作备忘',
      'tracking.refresh': '刷新',
      'tracking.refreshing': '刷新中…',
      'tracking.done': '追踪表已更新',
      'tracking.failed': '追踪表刷新失败',
      'tracking.empty': '还没有追踪数据。写一章，或点刷新让程序生成。',
      'tracking.volumes': '卷进度',
      'tracking.next': '下一步',
      'tracking.issues': '待处理',
      'tracking.recent': '最近写过的章',
      'tracking.open': '未收',
      'tracking.overdue': '逾期',
      'tracking.missing': '缺记忆',
      'tracking.stale': '记忆过期',
      'tracking.noSummaries': '还没有已写章节的摘要。',
      'tracking.noForeshadowing': '全书大纲里还没有登记伏笔。',
      'tracking.noCharacters': '还没有人物状态；写完提交后会出现在这里。',
      'tracking.generated': '由程序根据章节记忆生成；不要手改这一页。',
      'tracking.memoHint': '这里放作者的话、待办和提醒；Agent 写下一章前会读到。',
      'tracking.wordCount': '{n} 字',
      'tracking.lastChange': '最近变化',
      'tracking.current': '当前状态',
      'tracking.chapterNo': '第 {no} 章',
    })

    Object.assign(en, {
      'shelf.newBook': 'New book',
      'shelf.empty.title': 'No books yet',
      'shelf.empty.body': 'Start with one sentence. The agent will help you set up, outline, write, and export the whole novel.',
      'shelf.empty.hint': 'A book becomes its own folder and workspace.',
      'create.title': 'New book',
      'create.lead': 'One sentence is enough. The agent helps with the rest.',
      'create.name': 'Title',
      'create.nameHint': 'e.g. Letters from the Rain Harbour',
      'create.genre': 'Genre',
      'create.genreHint': 'Mystery / Fantasy / Romance / Wuxia…',
      'create.optional': 'optional',
      'create.idea': 'One-sentence idea',
      'create.ideaHint': 'e.g. a porter receives an unsigned letter.',
      'create.chapters': 'Planned chapters',
      'create.words': 'Words per chapter',
      'create.location': 'Location',
      'create.defaultLocation': 'Default location',
      'create.changeLocation': 'Change',
      'create.submit': 'Create book',
      'create.creating': 'Creating…',
      'create.cancel': 'Cancel',
      'create.required': 'Give the book a title first.',
      'create.failed': 'Could not create the book',
      'create.done': '“{title}” is ready. Next: setup.',
      'create.hint': 'No model call runs automatically; look around, then start setup.',
      'journey.next': 'Next',
      'journey.health': 'Book check',
      'journey.healthGood': 'Nothing obvious is open.',
      'journey.healthMore': '{n} more',
      'journey.progress': '{done} of {total} chapters written',
      'journey.export': 'Export',
      'journey.finish': 'Finish and export',
      'journey.checking': 'Checking…',
      'overview.export': 'Export',
      'overview.finish': 'Finish and export',
      'export.title': 'Export the book',
      'export.lead': 'Exporting never changes the book. Glance at the check before sending it out.',
      'export.format': 'Format',
      'export.docx': 'Word (.docx)',
      'export.html': 'HTML (print to PDF)',
      'export.md': 'Markdown',
      'export.txt': 'Plain text',
      'export.button': 'Export',
      'export.working': 'Exporting…',
      'export.done': '{chapters} chapters · {words} words',
      'export.download': 'Download {name}',
      'export.path': 'Saved to {path}',
      'export.again': 'Export again',
      'export.close': 'Close',
      'export.noText': 'No prose yet. Write the first chapter.',
      'export.failed': 'Export failed',
      'export.checkTitle': 'Before you send it out',
      'export.checkClean': 'Nothing obvious is open.',
      'export.detail': 'View',
      'health.good': 'Good',
      'health.warn': 'Open',
      'health.info': 'Note',
      'chapter.rewrite': 'Rewrite',
      'chapter.continue': 'Continue',
      'chapter.write': 'Write this',
      'chapter.noOutlineWrite': 'Outline first',
      'chapter.writingTitle': 'Writing chapter {no}',
      'chapter.rewritingTitle': 'Rewriting chapter {no}',
      'chapter.writingStarting': 'Preparing the writing session…',
      'chapter.writingElapsed': '{time} elapsed',
      'chapter.writingAside': 'Feel free to do something else.',
      'chapter.writingHint': 'The agent reads this chapter’s brief, drafts the prose, checks it and records the chapter memory. This page updates when it finishes.',
      'chapter.writingEditHint': 'The agent works in a rewrite draft; the published prose stays untouched. Read the draft in the session when it is done.',
      'chapter.writingWaiting': 'Waiting for you',
      'chapter.writingWaitingHint': 'The agent needs one answer before it can continue. Reply in the writing session and it will carry on.',
      'chapter.writingAnswer': 'Answer in the session',
      'chapter.writingOpen': 'Open writing session',
      'chapter.writingError': 'The chapter was not written',
      'chapter.writingErrorHint': 'No new prose was detected. Try again.',
      'chapter.writingRetry': 'Try again',
      'write.writingShort': 'Writing',
      'workbench.tracking': 'Book tracking',
      'tracking.progress': 'Progress',
      'tracking.summaries': 'Summaries',
      'tracking.foreshadowing': 'Threads',
      'tracking.characters': 'Characters',
      'tracking.memo': 'Notes',
      'tracking.refresh': 'Refresh',
      'tracking.refreshing': 'Refreshing…',
      'tracking.done': 'Tracking updated',
      'tracking.failed': 'Tracking refresh failed',
      'tracking.empty': 'No tracking data yet. Write a chapter or refresh to generate it.',
      'tracking.volumes': 'Volumes',
      'tracking.next': 'Next',
      'tracking.issues': 'Open issues',
      'tracking.recent': 'Recent chapters',
      'tracking.open': 'open',
      'tracking.overdue': 'overdue',
      'tracking.missing': 'Missing memory',
      'tracking.stale': 'Stale',
      'tracking.noSummaries': 'No written chapter summaries yet.',
      'tracking.noForeshadowing': 'No threads are registered in the outline yet.',
      'tracking.noCharacters': 'No character states yet; they appear after a chapter is submitted.',
      'tracking.generated': 'Generated from chapter memory; do not edit this page.',
      'tracking.memoHint': 'Author decisions, reminders and to-dos. The agent reads this before writing.',
      'tracking.wordCount': '{n} words',
      'tracking.lastChange': 'Recent changes',
      'tracking.current': 'Current states',
      'tracking.chapterNo': 'Chapter {no}',
    })

    /** Right-sidebar "book cockpit": stage-aware board, reader and live sync. */
    Object.assign(zh, {
      'panel.openBoard': '打开完整工作台',
      'panel.openSection': '打开',
      'panel.refreshHint': '刷新这本书',
      'panel.refreshFailed': '刷新失败，稍后再试一次。',
      'panel.synced': '同步于 {time}',
      'panel.updatedFlash': '已更新',
      'panel.busyShort': 'Agent 正在处理',
      'panel.waitingShort': '等你回答',
      'panel.writingNowHint': '正在取本章资料、写正文；完成后这里会自动更新。',
      'panel.writingNowWaiting': '需要你回答后才会继续写。',
      'panel.writingNowRewriteHint': 'Agent 在改写稿里工作；改完后这里会更新。',
      'panel.busy': 'Agent 正在处理这本书；你可以先看下面的内容，完成会自动刷新。',
      'panel.waiting': 'Agent 在等你回答一个问题，回到左边的对话继续。',
      'panel.nextStep': '下一步',
      'panel.hasOutline': '章纲已就位',
      'panel.ready': '已就位',
      'panel.missing': '还缺',
      'panel.more': '等 {n} 张',
      'panel.emptyHint': '把 .narracat 作品目录放进当前工作区，或在完整工作台里新建一本。',
      'panel.statsTitle': '这本书',
      'panel.recent': '章节一览',
      'panel.noChapters': '还没有章节；先把大纲搭起来。',
      'panel.stage.setup': '立项',
      'panel.stage.outline': '大纲',
      'panel.stage.prepare': '开写准备',
      'panel.stage.writing': '写正文',
      'panel.stage.done': '完本',
      'panel.step.setup': '立项',
      'panel.step.outline': '骨架',
      'panel.step.writing': '正文',
      'panel.step.done': '完本',
      'panel.setup.title': '立项卡',
      'panel.setup.progress': '{done} / {total} 张',
      'panel.setup.phase': '一次一个问题',
      'panel.setup.notSet': '还没定',
      'panel.setup.missing': '还缺：{list}',
      'panel.setup.ready': '九张卡都齐了，可以搭骨架了。',
      'panel.setup.hint': 'Agent 会一次问你一个问题；答完一张，这里就多一格。',
      'panel.setup.contract': '题材契约',
      'panel.setup.noGenre': '还没有定题材与读者期待。',
      'panel.outline.title': '全书骨架',
      'panel.outline.noSynopsis': '还没有全书梗概。',
      'panel.outline.volumes': '卷',
      'panel.outline.storylines': '故事线',
      'panel.outline.mysteries': '谜底',
      'panel.outline.foreshadowing': '伏笔',
      'panel.outline.noVolume': '还没有分卷。',
      'panel.outline.premisePartial': '立项卡还有 {done}/{total} 张可以补，边搭骨架边补也行。',
      'panel.outline.chapterOutlines': '章纲',
      'panel.outline.allChapters': '全部章节',
      'panel.outline.chapterCount': '共 {n} 章有章纲',
      'panel.outline.chapterN': '第 {no} 章',
      'panel.outline.meta': '{volumes} 卷 · {chapters} 章章纲',
      'panel.prepare.title': '开写准备',
      'panel.prepare.outline': '全书大纲',
      'panel.prepare.chapterOutline': '第 {no} 章章纲',
      'panel.prepare.castCount': '主要人物 {n} 个',
      'panel.prepare.worldCount': '世界设定 {n} 条',
      'panel.prepare.cast': '人物',
      'panel.prepare.world': '世界',
      'panel.prepare.missing': '还没建',
      'panel.prepare.meta': '章纲 {chapters} · 人物 {cast} · 世界 {world}',
      'panel.prepare.firstChapter': '第一章',
      'panel.prepare.openOutline': '看章纲',
      'panel.prepare.read': '看本章资料',
      'panel.prepare.noChapterOutline': '第一章还没有章纲；先补一份，写的时候不容易飘。',
      'panel.prepare.hint': '先把人物和世界立住，写第一章时 Agent 取料更稳。',
      'panel.prepare.castEmpty': '还没有主要人物档案。',
      'panel.prepare.worldEmpty': '还没有世界设定。',
      'panel.prepare.addCast': '先建 2–3 个',
      'panel.prepare.addWorld': '先立 3–5 条规则',
      'panel.writing.title': '正文现场',
      'panel.writing.hasText': '已有正文',
      'panel.writing.nextChapter': '下一章',
      'panel.writing.lastSummary': '前情 · 第 {no} 章',
      'panel.writing.openMemory': '看本章记忆',
      'panel.writing.noSummary': '还没有章节记忆；写完一章后，这里会出现前情提要。',
      'panel.writing.attention': '要留意',
      'panel.writing.noAttention': '暂时没有要处理的问题。',
      'panel.writing.memoryMissing': '{n} 章还没记记忆',
      'panel.writing.memoryStale': '{n} 章记忆过期',
      'panel.writing.reviewFail': '{n} 章审校没过',
      'panel.writing.gaps': '{n} 章缺正文',
      'panel.writing.foreshadowing': '{n} 条伏笔未收',
      'panel.writing.viewAll': '全部章节',
      'panel.done.title': '全书完成',
      'panel.done.summary': '{words} 字 · 记忆 {memory} 章',
      'panel.done.export': '导出成稿',
      'panel.done.exportHint': 'Word / HTML / Markdown / TXT，导出前会做一次全书检查。',
      'panel.done.check': '完本检查',
      'panel.done.clean': '没有明显的坑，可以直接导出。',
      'panel.done.reviews': '审校',
      'panel.done.reviewHint': '审校只查不改；没过的地方建议先改再导出。',
      'panel.done.memory': '记忆',
      'panel.stat.premise': '立项',
      'panel.stat.cast': '人物',
      'panel.stat.world': '世界',
      'panel.stat.chapterOutlines': '章纲',
      'panel.stat.written': '已写',
      'panel.stat.reviews': '审校',
      'panel.stat.memory': '记忆',
      'panel.stat.foreshadowing': '伏笔',
      'panel.openPremise': '看立项卡',
      'panel.openOutline': '看全书大纲',
      'panel.openSettings': '看人物与设定',
      'panel.openStatus': '看本书现状',
      'panel.openDone': '打开完本检查',
      'panel.promptContinueSetup': '继续立项',
      'panel.promptContinueSetupText': '继续带我立项：先看还缺哪几张卡，一次只问我一个最关键的问题；能从已有内容推断的不要问。',
      'panel.promptContinueOutline': '继续搭骨架',
      'panel.promptContinueOutlineText': '继续帮我把这本书的骨架搭完：先看现在有什么、还缺什么，从最关键的下一步开始，不要一次铺满全书。',
      'panel.promptContinuePrepare': '补齐开写准备',
      'panel.promptContinuePrepareText': '帮我把开写准备补齐：先看人物、世界和第一章章纲缺什么，从最关键的一样开始，一次只做一件事。',
      'panel.promptDone': '完本检查',
      'panel.promptDoneText': '全书已经写完，帮我做一次完本检查：看进度、审校、记忆和伏笔还有没有明显的问题，再告诉我能不能导出。',
      'panel.askMissingShort': '还缺什么',
      'panel.askMissing': '这本书现在还缺什么？按重要程度排一下，先告诉我最该补的那一样。',
      'panel.promptCast': '帮我建 2–3 个主要人物：先定他们在故事里的作用、想要什么、和主角的关系。',
      'panel.promptWorld': '帮我把这本书的世界观立起来：先定 3–5 条会和剧情冲突的规则。',
      'panel.promptWriteChapter': '写第 {no} 章。先看这本书的写作现状和本章资料；如果本章还没有章纲，先补一份简短的章纲再写。写完保存好，再告诉我结果。',
      'panel.promptPlanChapter': '请为第 {no} 章补一份可写的章纲：场景、冲突、出场人物、这一章改变了什么、收尾留什么钩子。',
      'panel.promptRewrite': '我想改第 {no} 章：先打开改写稿，按我的要求改，改完保存好再告诉我；不要直接改正式正文。先问我最想改哪一点。',
      'panel.reader.back': '返回看板',
      'panel.reader.prev': '上一章',
      'panel.reader.next': '下一章',
      'panel.reader.empty': '这一章还没有内容。',
      'panel.reader.emptyFile': '正文文件是空的。',
      'panel.reader.outlineReady': '章纲已就位',
      'panel.reader.outlineGist': '章纲摘要',
      'panel.reader.noOutline': '还没有章纲',
      'panel.reader.noOutlineHint': '这一章还没有正文，也没有章纲；先补一份章纲，再动笔。',
      'panel.reader.briefHint': '这一章还没写，先看章纲里的场景、冲突和收束。',
      'panel.reader.beats': '这一章的拍',
      'panel.reader.writeThis': '写这一章',
      'panel.reader.planThis': '补章纲',
      'panel.reader.openOutline': '看完整章纲',
      'panel.reader.loading': '正在读正文…',
      'panel.reader.retry': '重试',
      'panel.reader.rewrite': '改写这一章',
    })

    Object.assign(en, {
      'panel.openBoard': 'Open full workbench',
      'panel.openSection': 'Open',
      'panel.refreshHint': 'Refresh this book',
      'panel.refreshFailed': 'Refresh failed; try again in a moment.',
      'panel.synced': 'Synced {time}',
      'panel.updatedFlash': 'Updated',
      'panel.busyShort': 'Agent working',
      'panel.waitingShort': 'Waiting for you',
      'panel.writingNowHint': 'Reading the brief, drafting and checking; this panel updates when the chapter is done.',
      'panel.writingNowWaiting': 'It needs your answer before it continues.',
      'panel.writingNowRewriteHint': 'The agent works in a rewrite draft; this panel updates when it is done.',
      'panel.busy': 'The Agent is working on this book. You can read below; it updates when the turn finishes.',
      'panel.waiting': 'The Agent is waiting for your answer; continue in the conversation on the left.',
      'panel.nextStep': 'Next step',
      'panel.hasOutline': 'Outline ready',
      'panel.ready': 'Ready',
      'panel.missing': 'Missing',
      'panel.more': '+{n} more',
      'panel.emptyHint': 'Put a .narracat book folder in this workspace, or create one from the full workbench.',
      'panel.statsTitle': 'This book',
      'panel.recent': 'Chapters',
      'panel.noChapters': 'No chapters yet; outline the book first.',
      'panel.stage.setup': 'Premise',
      'panel.stage.outline': 'Outline',
      'panel.stage.prepare': 'Getting ready',
      'panel.stage.writing': 'Writing',
      'panel.stage.done': 'Complete',
      'panel.step.setup': 'Premise',
      'panel.step.outline': 'Outline',
      'panel.step.writing': 'Draft',
      'panel.step.done': 'Done',
      'panel.setup.title': 'Premise cards',
      'panel.setup.progress': '{done} / {total} cards',
      'panel.setup.phase': 'One question at a time',
      'panel.setup.notSet': 'Not set',
      'panel.setup.missing': 'Still missing: {list}',
      'panel.setup.ready': 'All nine cards are in; the outline can start.',
      'panel.setup.hint': 'The Agent asks one question at a time; each answer fills one more cell here.',
      'panel.setup.contract': 'Genre contract',
      'panel.setup.noGenre': 'The genre and reader promise are not set yet.',
      'panel.outline.title': 'Story skeleton',
      'panel.outline.noSynopsis': 'No book synopsis yet.',
      'panel.outline.volumes': 'Volumes',
      'panel.outline.storylines': 'Storylines',
      'panel.outline.mysteries': 'Mysteries',
      'panel.outline.foreshadowing': 'Threads',
      'panel.outline.noVolume': 'No volumes yet.',
      'panel.outline.premisePartial': '{done}/{total} premise cards can still be filled; you can outline and fill them together.',
      'panel.outline.chapterOutlines': 'Chapter outlines',
      'panel.outline.allChapters': 'All chapters',
      'panel.outline.chapterCount': '{n} chapters have outlines',
      'panel.outline.chapterN': 'Chapter {no}',
      'panel.outline.meta': '{volumes} volumes · {chapters} chapter outlines',
      'panel.prepare.title': 'Ready to draft',
      'panel.prepare.outline': 'Book outline',
      'panel.prepare.chapterOutline': 'Chapter {no} outline',
      'panel.prepare.castCount': 'Cast ({n})',
      'panel.prepare.worldCount': 'World rules ({n})',
      'panel.prepare.cast': 'Cast',
      'panel.prepare.world': 'World',
      'panel.prepare.missing': 'Not built',
      'panel.prepare.meta': '{chapters} outlines · {cast} characters · {world} world rules',
      'panel.prepare.firstChapter': 'Chapter one',
      'panel.prepare.openOutline': 'Open outline',
      'panel.prepare.read': 'Chapter brief',
      'panel.prepare.noChapterOutline': 'Chapter one has no outline yet; write one first so the draft has a spine.',
      'panel.prepare.hint': 'Stand up the cast and world first; the Agent drafts chapter one with steadier material.',
      'panel.prepare.castEmpty': 'No main characters yet.',
      'panel.prepare.worldEmpty': 'No world rules yet.',
      'panel.prepare.addCast': 'Build 2–3',
      'panel.prepare.addWorld': 'Set 3–5 rules',
      'panel.writing.title': 'On the page',
      'panel.writing.hasText': 'Drafted',
      'panel.writing.nextChapter': 'Next chapter',
      'panel.writing.lastSummary': 'Previously · chapter {no}',
      'panel.writing.openMemory': 'Open chapter memory',
      'panel.writing.noSummary': 'No chapter memory yet; once a chapter is written, its recap appears here.',
      'panel.writing.attention': 'Worth a look',
      'panel.writing.noAttention': 'Nothing needs attention right now.',
      'panel.writing.memoryMissing': '{n} chapters have no memory',
      'panel.writing.memoryStale': '{n} chapters have stale memory',
      'panel.writing.reviewFail': '{n} chapters failed review',
      'panel.writing.gaps': '{n} chapters have no prose',
      'panel.writing.foreshadowing': '{n} threads are unresolved',
      'panel.writing.viewAll': 'All chapters',
      'panel.done.title': 'Book complete',
      'panel.done.summary': '{words} words · {memory} chapters of memory',
      'panel.done.export': 'Export',
      'panel.done.exportHint': 'Word / HTML / Markdown / TXT; a full-book check runs before export.',
      'panel.done.check': 'Completion check',
      'panel.done.clean': 'No obvious gaps; export when ready.',
      'panel.done.reviews': 'Reviews',
      'panel.done.reviewHint': 'Reviews only inspect; fix failed chapters before exporting.',
      'panel.done.memory': 'Memory',
      'panel.stat.premise': 'Premise',
      'panel.stat.cast': 'Cast',
      'panel.stat.world': 'World',
      'panel.stat.chapterOutlines': 'Outlines',
      'panel.stat.written': 'Written',
      'panel.stat.reviews': 'Reviews',
      'panel.stat.memory': 'Memory',
      'panel.stat.foreshadowing': 'Threads',
      'panel.openPremise': 'Open premise',
      'panel.openOutline': 'Open outline',
      'panel.openSettings': 'Open cast & world',
      'panel.openStatus': 'Open status',
      'panel.openDone': 'Open completion check',
      'panel.promptContinueSetup': 'Continue premise',
      'panel.promptContinueSetupText': 'Continue taking me through the premise: look at the missing cards first and ask me one key question at a time; infer anything you can.',
      'panel.promptContinueOutline': 'Continue outline',
      'panel.promptContinueOutlineText': 'Continue the story skeleton: look at what exists and what is missing, then take the single most important next step without planning the whole book at once.',
      'panel.promptContinuePrepare': 'Finish prep',
      'panel.promptContinuePrepareText': 'Help me finish the draft prep: look at the cast, world and chapter-one outline, and start with the one thing that matters most.',
      'panel.promptDone': 'Completion check',
      'panel.promptDoneText': 'The book is finished. Run a completion check over progress, reviews, memory and threads, then tell me whether it is ready to export.',
      'panel.askMissingShort': 'What is missing',
      'panel.askMissing': 'What does this book still need? Rank it and tell me the single most important thing first.',
      'panel.promptCast': 'Build 2–3 main characters: define their role in the story, what they want, and how they relate to the protagonist.',
      'panel.promptWorld': 'Stand up this book’s world: define 3–5 rules that will create conflict with the plot.',
      'panel.promptWriteChapter': 'Write chapter {no}. Read the book status and this chapter’s brief first; if it has no outline, write a short one before drafting. Save it and tell me the result.',
      'panel.promptPlanChapter': 'Write a usable outline for chapter {no}: scenes, conflict, cast, what changes, and the hook at the end.',
      'panel.promptRewrite': 'I want to revise chapter {no}: open the rewrite draft, revise it to my notes, save it and tell me the result; do not edit the published prose directly. Ask me what to change first.',
      'panel.reader.back': 'Back to board',
      'panel.reader.prev': 'Previous chapter',
      'panel.reader.next': 'Next chapter',
      'panel.reader.empty': 'This chapter has no content yet.',
      'panel.reader.emptyFile': 'The chapter file is empty.',
      'panel.reader.outlineReady': 'Outline ready',
      'panel.reader.outlineGist': 'Outline at a glance',
      'panel.reader.noOutline': 'No outline yet',
      'panel.reader.noOutlineHint': 'This chapter has no prose and no outline; write the outline first.',
      'panel.reader.briefHint': 'This chapter has not been drafted; read its scenes, conflict and ending first.',
      'panel.reader.beats': 'Beats in this chapter',
      'panel.reader.writeThis': 'Write this chapter',
      'panel.reader.planThis': 'Write outline',
      'panel.reader.openOutline': 'Full outline',
      'panel.reader.loading': 'Reading the chapter…',
      'panel.reader.retry': 'Retry',
      'panel.reader.rewrite': 'Revise this chapter',
    })

// ---- 20-util.js ----
    /**
     * GET one API route.
     * @param {string} route - route below the API base.
     * @returns {Promise<any>} decoded JSON.
     */
    async function apiGet(route) {
      const response = await fetch(API + route, { credentials: 'same-origin', headers: { accept: 'application/json' } })
      const value = await response.json().catch(() => ({ ok: false, error: { message: `HTTP ${response.status}` } }))
      if (!response.ok || value.ok === false) throw new Error(value?.error?.message ?? `HTTP ${response.status}`)
      return value
    }

    /**
     * PUT one API route.
     * @param {string} route - route below the API base.
     * @param {unknown} body - JSON body.
     * @returns {Promise<any>} decoded JSON.
     */
    async function apiPut(route, body) {
      const response = await fetch(API + route, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const value = await response.json().catch(() => ({ ok: false, error: { message: `HTTP ${response.status}` } }))
      if (!response.ok || value.ok === false) throw new Error(value?.error?.message ?? `HTTP ${response.status}`)
      return value
    }

    /**
     * POST one API route.
     * @param {string} route - route below the API base.
     * @param {unknown} body - JSON body.
     * @returns {Promise<any>} decoded JSON.
     */
    async function apiPost(route, body) {
      const response = await fetch(API + route, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const value = await response.json().catch(() => ({ ok: false, error: { message: `HTTP ${response.status}` } }))
      if (!response.ok || value.ok === false) throw new Error(value?.error?.message ?? `HTTP ${response.status}`)
      return value
    }

    /**
     * Fill `{name}` placeholders.
     * @param {string} template - copy with placeholders.
     * @param {Record<string, string | number>} values - replacements.
     * @returns {string} filled copy.
     */
    function fill(template, values) {
      return template.replace(/\{(\w+)\}/g, (match, name) => (name in values ? String(values[name]) : match))
    }

    /**
     * Human-readable byte size.
     * @param {number | null | undefined} bytes - byte count.
     * @returns {string} formatted size.
     */
    function formatBytes(bytes) {
      if (typeof bytes !== 'number' || !Number.isFinite(bytes)) return '—'
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`
      return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
    }

    /**
     * Human-readable relative timestamp.
     * @param {number | null | undefined} time - epoch milliseconds.
     * @returns {string} a short relative or absolute label.
     */
    function formatTime(time, t) {
      if (typeof time !== 'number' || !Number.isFinite(time) || time <= 0) return '—'
      const tr = typeof t === 'function' ? t : (key) => ({ 'time.justNow': 'just now', 'time.minutes': 'min ago', 'time.hours': 'h ago' })[key] ?? key
      const delta = Date.now() - time
      if (delta < 60_000) return tr('time.justNow')
      if (delta < 3_600_000) return `${Math.round(delta / 60_000)} ${tr('time.minutes')}`
      if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)} ${tr('time.hours')}`
      const date = new Date(time)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

// ---- 30-css.js ----
    const CSS = `
/* Horizontal inset scale: app bar 16 · directory head 16 · list rows 12 (children 36) · content toolbar 20/16 · panel 18/12 · overview 40 · buttons 14/12. */
.nw-root{
  --nw-font:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif;
  --nw-serif:"Songti SC","STSong","SimSun","Noto Serif CJK SC","Source Han Serif SC",serif;
  --nw-mono:ui-monospace,"SF Mono","Cascadia Mono",Menlo,monospace;
  --nw-canvas:color-mix(in oklab,var(--dsw-alias-bg-base) 96%,var(--dsw-alias-label-primary));
  --nw-surface:var(--dsw-alias-bg-layer-1);
  --nw-aside:color-mix(in oklab,var(--nw-canvas) 55%,var(--nw-surface));
  --nw-paper:#f5f3ef;
  --nw-border:var(--dsw-alias-border-l1);
  --nw-border-strong:var(--dsw-alias-border-l2);
  --nw-text-1:var(--dsw-alias-label-primary);
  --nw-text-2:var(--dsw-alias-label-secondary);
  --nw-text-3:color-mix(in oklab,var(--dsw-alias-label-secondary) 85%,var(--dsw-alias-bg-base));
  --nw-hover:color-mix(in oklab,var(--dsw-alias-label-primary) 4%,transparent);
  --nw-active:color-mix(in oklab,var(--dsw-alias-label-primary) 7%,transparent);
  --nw-primary:var(--dsw-alias-label-primary);
  --nw-primary-fg:var(--dsw-alias-bg-base);
  --nw-success:color-mix(in oklab,var(--dsw-alias-state-success-primary) 55%,var(--dsw-alias-label-primary));
  --nw-warn:color-mix(in oklab,var(--dsw-alias-state-warn-primary) 55%,var(--dsw-alias-label-primary));
  --nw-danger:var(--dsw-alias-state-error-primary);
  --nw-tint-alpha:13%;
  --nw-shadow-card:0 8px 24px rgb(0 0 0 / 7%);
  --nw-shadow-float:0 18px 48px rgb(0 0 0 / 10%);
  --nw-shadow-cover:0 36px 64px -26px rgba(24,23,20,.42),0 10px 22px -12px rgba(24,23,20,.24);
  --nw-shadow-cover-side:0 22px 44px -24px rgba(24,23,20,.35);
  height:100%;min-height:0;background:var(--nw-canvas);color:var(--nw-text-1);font-family:var(--nw-font);font-size:14px;line-height:1.55;-webkit-font-smoothing:antialiased;overflow:hidden;
}
body[data-ds-dark-theme] .nw-root{
  --nw-paper:#141311;
  --nw-text-3:color-mix(in oklab,var(--dsw-alias-label-secondary) 70%,var(--dsw-alias-bg-base));
  --nw-hover:rgba(255,255,255,.06);
  --nw-active:rgba(255,255,255,.10);
  --nw-primary-fg:#171614;
  --nw-success:var(--dsw-alias-state-success-primary);
  --nw-warn:var(--dsw-alias-state-warn-primary);
  --nw-danger:var(--dsw-alias-state-error-primary);
  --nw-tint-alpha:22%;
  --nw-shadow-card:0 8px 24px rgb(0 0 0 / 32%);
  --nw-shadow-float:0 18px 48px rgb(0 0 0 / 40%);
  --nw-shadow-cover:0 36px 64px -22px rgba(0,0,0,.78),0 10px 22px -10px rgba(0,0,0,.5);
  --nw-shadow-cover-side:0 22px 44px -22px rgba(0,0,0,.7);
}
.nw-root *{box-sizing:border-box}
.nw-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.nw-root svg{display:block;flex:0 0 auto}
.nw-root .nw-spacer{flex:1 1 auto;min-width:0}
.nw-root :focus-visible{outline:2px solid color-mix(in oklab,var(--nw-text-2) 80%,transparent);outline-offset:2px}
.nw-root ::selection{background:color-mix(in oklab,var(--dsw-alias-brand-primary,#4176e6) 40%,transparent)}
.nw-root ::-webkit-scrollbar{width:10px;height:10px}
.nw-root ::-webkit-scrollbar-track{background:transparent}
.nw-root ::-webkit-scrollbar-thumb{background:var(--nw-border);border:3px solid transparent;background-clip:content-box;border-radius:999px}
.nw-root ::-webkit-scrollbar-thumb:hover{background:var(--nw-border-strong);background-clip:content-box}

/* shared controls */
.nw-btn{height:32px;padding:0 14px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-size:13px;font-weight:500;line-height:1;white-space:nowrap;flex:0 0 auto;transition:background .15s,color .15s,opacity .15s}
.nw-btn.is-sm{height:28px;padding:0 12px;font-size:12px}
.nw-btn.is-primary{background:var(--nw-primary);color:var(--nw-primary-fg)}
.nw-btn.is-primary:hover{opacity:.9}
.nw-btn.is-secondary{background:var(--nw-hover);color:var(--nw-text-1)}
.nw-btn.is-secondary:hover{background:var(--nw-active)}
.nw-btn.is-ghost{color:var(--nw-text-2)}
.nw-btn.is-ghost:hover{background:var(--nw-hover);color:var(--nw-text-1)}
.nw-btn:disabled{opacity:.42;cursor:default}
.nw-iconbtn{position:relative;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;color:var(--nw-text-2);flex:0 0 auto;transition:background .15s,color .15s}
.nw-iconbtn:hover{background:var(--nw-hover);color:var(--nw-text-1)}
.nw-iconbtn:disabled{opacity:.35;cursor:default}
/* Icon-only controls explain themselves on hover and keyboard focus. The
   bubble is CSS-only so it needs no render pass and cannot steal the pointer;
   the brief visibility delay avoids flashing labels while the cursor crosses
   a toolbar. Native title is intentionally absent (it would double up). */
.nw-iconbtn[data-tip]::after,
.nw-contact-close[data-tip]::after{content:attr(data-tip);position:absolute;z-index:140;left:50%;top:calc(100% + 7px);transform:translateX(-50%) translateY(-2px);max-width:240px;padding:5px 9px;border-radius:7px;background:color-mix(in oklab,var(--nw-text-1) 94%,transparent);color:var(--nw-primary-fg);font-family:var(--nw-font);font-size:11px;font-weight:500;line-height:1.4;letter-spacing:.01em;white-space:nowrap;box-shadow:0 8px 20px rgb(0 0 0 / 16%);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .12s ease,transform .12s ease,visibility 0s .16s}
.nw-iconbtn[data-tip]::before,
.nw-contact-close[data-tip]::before{content:"";position:absolute;z-index:141;left:50%;top:calc(100% + 1px);margin-left:-4px;border:4px solid transparent;border-bottom-color:color-mix(in oklab,var(--nw-text-1) 94%,transparent);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .12s ease,visibility 0s .16s}
.nw-iconbtn[data-tip]:hover::after,
.nw-iconbtn[data-tip]:focus-visible::after,
.nw-contact-close[data-tip]:hover::after,
.nw-contact-close[data-tip]:focus-visible::after{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0);transition:opacity .12s ease .28s,transform .12s ease .28s,visibility 0s .28s}
.nw-iconbtn[data-tip]:hover::before,
.nw-iconbtn[data-tip]:focus-visible::before,
.nw-contact-close[data-tip]:hover::before,
.nw-contact-close[data-tip]:focus-visible::before{opacity:1;visibility:visible;transition:opacity .12s ease .28s,visibility 0s .28s}
.nw-iconbtn[data-tip-align="start"]::after{left:0;transform:translateY(-2px)}
.nw-iconbtn[data-tip-align="start"]:hover::after,
.nw-iconbtn[data-tip-align="start"]:focus-visible::after{transform:none}
.nw-iconbtn[data-tip-align="start"]::before{left:14px;margin-left:0}
.nw-iconbtn[data-tip-align="end"]::after{left:auto;right:0;transform:translateY(-2px)}
.nw-iconbtn[data-tip-align="end"]:hover::after,
.nw-iconbtn[data-tip-align="end"]:focus-visible::after{transform:none}
.nw-iconbtn[data-tip-align="end"]::before{left:auto;right:14px;margin-left:0}
.nw-contact-close[data-tip-align="end"]::after{left:auto;right:0;transform:translateY(-2px)}
.nw-contact-close[data-tip-align="end"]:hover::after,
.nw-contact-close[data-tip-align="end"]:focus-visible::after{transform:none}
.nw-contact-close[data-tip-align="end"]::before{left:auto;right:15px;margin-left:0}
.nw-iconbtn[data-tip-place="top"]::after{top:auto;bottom:calc(100% + 7px);transform:translateX(-50%) translateY(2px)}
.nw-iconbtn[data-tip-place="top"]:hover::after,
.nw-iconbtn[data-tip-place="top"]:focus-visible::after{transform:translateX(-50%)}
.nw-iconbtn[data-tip-place="top"]::before{top:auto;bottom:calc(100% + 1px);border-bottom-color:transparent;border-top-color:color-mix(in oklab,var(--nw-text-1) 94%,transparent)}
.nw-tag{height:20px;padding:0 8px;border-radius:999px;display:inline-flex;align-items:center;font-size:11px;font-weight:500;line-height:1;background:var(--nw-hover);color:var(--nw-text-2);white-space:nowrap}
.nw-tag.is-success{background:color-mix(in oklab,var(--nw-success) 12%,transparent);color:var(--nw-success)}
.nw-tag.is-warn{background:color-mix(in oklab,var(--nw-warn) 14%,transparent);color:var(--nw-warn)}
.nw-tag.is-plain{background:transparent;border:1px solid var(--nw-border);color:var(--nw-text-3);font-weight:400}
.nw-muted{color:var(--nw-text-3);font-size:12px;line-height:1.7}
.nw-kv{display:flex;gap:10px;font-size:12px;line-height:1.75;padding:1px 0}
.nw-kv dt{width:58px;flex:0 0 58px;margin:0;color:var(--nw-text-3)}
.nw-panel .nw-kv dt{width:88px;flex:0 0 88px}
.nw-kv dd{flex:1 1 auto;min-width:0;margin:0;overflow-wrap:anywhere}

/* shelf poster */
.nw-shelf{--shelf-info-h:400px;position:relative;display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;background:var(--nw-paper);color:var(--nw-text-1);container-type:inline-size}
.nw-shelf::after{content:"";position:absolute;inset:0;background-image:${NOISE};opacity:.035;pointer-events:none;mix-blend-mode:multiply;z-index:20}
body[data-ds-dark-theme] .nw-shelf::after{mix-blend-mode:screen;opacity:.04}
.nw-root.is-mac-titlebar .nw-topbar{padding-left:160px}
.nw-topbar{height:52px;flex:0 0 52px;display:flex;align-items:center;gap:10px;padding:0 56px 0 64px;position:relative;z-index:10;transition:padding-left .18s ease}
.nw-shelf .nw-brand{display:flex;align-items:center;gap:10px;font-size:12px;letter-spacing:.08em}
.nw-shelf .nw-logo{width:27px;height:27px;object-fit:contain;display:block;flex:0 0 auto}
.nw-panel-logo{display:block;object-fit:contain}
body[data-ds-dark-theme] .nw-panel-logo{filter:invert(1) brightness(.92)}
body[data-ds-dark-theme] .nw-shelf .nw-logo{filter:invert(1) brightness(.92)}
.nw-shelf .nw-brand-name{white-space:nowrap}
.nw-shelf .nw-brand-dot{width:5px;height:5px;border-radius:50%;background:var(--nw-accent,var(--nw-text-1));margin-left:-2px}
.nw-shelf .nw-stage{flex:1 1 auto;width:100%;max-width:1500px;margin:0 auto;min-height:0;display:grid;grid-template-columns:minmax(460px,620px) minmax(0,1fr);grid-template-rows:var(--shelf-info-h) minmax(0,1fr);grid-template-areas:"copy gallery" "index gallery";padding:44px 56px 42px 64px;position:relative;z-index:2}
.nw-shelf .nw-copy{grid-area:copy;display:flex;flex-direction:column;min-width:0;height:var(--shelf-info-h);overflow:hidden;padding-right:24px;position:relative;z-index:3}
.nw-shelf .nw-eyebrow{font-size:9px;letter-spacing:.26em;color:var(--nw-text-3);display:flex;align-items:center;gap:10px}
.nw-shelf .nw-eyebrow::after{content:"";width:34px;height:1px;background:var(--nw-border);display:block}
.nw-shelf .nw-book-title{font-family:var(--nw-serif);font-weight:600;font-size:clamp(46px,4.9vw,72px);line-height:1.06;letter-spacing:.015em;margin:18px 0 0;max-width:100%;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:1.08em;max-height:2.16em}
.nw-shelf .nw-synopsis{margin:20px 0 0;max-width:27em;font-size:14.5px;line-height:1.95;color:var(--nw-text-2);letter-spacing:.01em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;height:3.9em}
.nw-shelf .nw-meta{margin-top:18px;display:flex;align-items:center;gap:9px;font-size:11px;letter-spacing:.08em;color:var(--nw-text-3);font-variant-numeric:tabular-nums;flex-wrap:nowrap;height:18px;overflow:hidden;white-space:nowrap}
.nw-shelf .nw-meta-dot{width:2px;height:2px;border-radius:50%;background:var(--nw-text-3);display:block}
.nw-shelf .nw-actions{margin-top:24px;padding-top:0;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.nw-shelf .nw-cta{height:38px;padding:0 18px;border-radius:999px;background:var(--nw-primary);color:var(--nw-primary-fg);display:inline-flex;align-items:center;gap:9px;font-size:12.5px;font-weight:500;letter-spacing:.03em;transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s}
.nw-shelf .nw-cta-arrow{transition:transform .25s cubic-bezier(.2,.8,.2,1)}
.nw-shelf .nw-cta:hover{transform:translateY(-1px);box-shadow:0 8px 18px -8px rgba(0,0,0,.4)}
.nw-shelf .nw-cta:hover .nw-cta-arrow{transform:translateX(3px)}
.nw-shelf .nw-newbook{height:38px;padding:0 16px;border-radius:999px;border:1px solid var(--nw-border-strong);display:inline-flex;align-items:center;gap:7px;font-size:12px;letter-spacing:.03em;color:var(--nw-text-2);background:transparent;transition:color .2s,border-color .2s,background .2s}
.nw-shelf .nw-newbook:hover{color:var(--nw-text-1);border-color:var(--nw-text-2);background:color-mix(in oklab,var(--nw-text-1) 4%,transparent)}
.nw-shelf .nw-link{font-size:11.5px;letter-spacing:.05em;color:var(--nw-text-2);display:inline-flex;align-items:center;gap:6px;border-bottom:1px solid transparent;padding-bottom:1px;transition:color .2s,border-color .2s}
.nw-shelf .nw-link:hover{color:var(--nw-text-1);border-color:var(--nw-text-3)}
.nw-shelf .nw-index{grid-area:index;display:flex;flex-direction:column;min-height:0;overflow:hidden;padding:18px 24px 0 0}
.nw-shelf .nw-index-head{display:flex;justify-content:space-between;align-items:baseline;flex:0 0 auto;padding-bottom:9px;border-bottom:1px solid var(--nw-border);font-size:9px;letter-spacing:.22em;color:var(--nw-text-3)}
.nw-shelf .nw-index-list{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding-right:6px}
.nw-shelf .nw-index-list::-webkit-scrollbar{width:8px}
.nw-shelf .nw-index-list::-webkit-scrollbar-thumb{background:var(--nw-border);border:2px solid transparent;background-clip:content-box;border-radius:999px}
.nw-shelf .nw-irow{width:100%;display:grid;grid-template-columns:34px minmax(0,1fr) auto 18px;align-items:center;gap:10px;height:46px;border-bottom:1px solid var(--nw-border);text-align:left;color:var(--nw-text-2);position:relative;transition:color .2s}
.nw-shelf .nw-irow-num{font-family:var(--nw-serif);font-size:11px;letter-spacing:.1em;color:var(--nw-text-3);transition:color .2s}
.nw-shelf .nw-irow-title{font-size:13.5px;letter-spacing:.02em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:font-weight .2s,color .2s}
.nw-shelf .nw-irow-meta{font-size:10px;letter-spacing:.08em;color:var(--nw-text-3);font-variant-numeric:tabular-nums}
.nw-shelf .nw-irow-arrow{opacity:0;transform:translateX(-4px);transition:opacity .2s,transform .2s;color:var(--nw-text-3)}
.nw-shelf .nw-irow:hover{color:var(--nw-text-1)}
.nw-shelf .nw-irow:hover .nw-irow-arrow{opacity:1;transform:none}
.nw-shelf .nw-irow.is-active{color:var(--nw-text-1)}
.nw-shelf .nw-irow.is-active .nw-irow-title{font-weight:600}
.nw-shelf .nw-irow.is-active .nw-irow-num{color:var(--nw-accent)}
.nw-shelf .nw-irow.is-active .nw-irow-arrow{opacity:.55;transform:none}
.nw-shelf .nw-irow.is-active::before{content:"";position:absolute;left:-14px;top:50%;width:4px;height:4px;border-radius:50%;background:var(--nw-accent);transform:translateY(-50%)}
.nw-shelf .nw-gallery{grid-area:gallery;position:relative;min-width:0;z-index:2}
.nw-shelf .nw-glow{position:absolute;left:50%;top:50%;width:740px;height:740px;margin:-370px 0 0 -370px;border-radius:50%;background:radial-gradient(circle,color-mix(in oklab,var(--nw-accent) var(--nw-tint-alpha),transparent) 0%,transparent 66%);filter:blur(6px);transition:background .6s}
.nw-shelf .nw-big-number{position:absolute;right:-26px;top:-56px;font-family:var(--nw-serif);font-weight:500;font-size:286px;line-height:.8;letter-spacing:-.03em;color:var(--nw-text-1);opacity:.045;user-select:none;pointer-events:none}
.nw-shelf .nw-hairline{position:absolute;left:0;right:0;top:0;height:1px;background:var(--nw-border)}
.nw-shelf .nw-fan{position:absolute;left:50%;top:0;bottom:0;width:min(100%,560px);transform:translateX(-50%)}
.nw-shelf .nw-card{position:absolute;transform-origin:50% 60%;transition:transform .65s cubic-bezier(.16,1,.3,1),box-shadow .45s,filter .45s,opacity .45s}
.nw-shelf .nw-card .nw-cover{box-shadow:none}
.nw-shelf .nw-card.is-side{width:190px;height:285px;top:50%;margin-top:-124px;z-index:1;filter:saturate(.8) brightness(.92);opacity:.88}
.nw-shelf .nw-card.is-side .nw-cover{box-shadow:none}
.nw-shelf .nw-card.is-hero .nw-cover{box-shadow:0 0 0 1px rgba(255,255,255,.05)}
body[data-ds-dark-theme] .nw-shelf .nw-card.is-hero .nw-cover{box-shadow:0 0 0 1px rgba(255,255,255,.07)}
.nw-shelf .nw-card.is-left{left:0;transform:rotate(-7deg)}
.nw-shelf .nw-card.is-right{right:0;transform:rotate(7deg)}
.nw-shelf .nw-card.is-side:hover{filter:none;opacity:1;z-index:4;transform:rotate(-3deg) translateY(-14px) scale(1.04)}
.nw-shelf .nw-card.is-side.is-right:hover{transform:rotate(3deg) translateY(-14px) scale(1.04)}
.nw-shelf .nw-card.is-hero{left:50%;top:47%;width:330px;height:495px;margin:-247px 0 0 -165px;z-index:3;transform:translateY(var(--lift,0px)) rotate(calc(-1.6deg + var(--tilt,0deg)))}
.nw-shelf .nw-card.is-hero:hover{--lift:-7px}
.nw-shelf .nw-card.is-hero .nw-cover{animation:nw-cover-in .55s cubic-bezier(.16,1,.3,1) .02s both}
.nw-shelf .nw-card.is-left .nw-cover{animation:nw-cover-in .55s cubic-bezier(.16,1,.3,1) .06s both}
.nw-shelf .nw-card.is-right .nw-cover{animation:nw-cover-in .55s cubic-bezier(.16,1,.3,1) .12s both}
.nw-shelf .nw-book-title{animation:nw-rise .5s cubic-bezier(.16,1,.3,1) both}
.nw-shelf .nw-synopsis{animation:nw-rise .55s cubic-bezier(.16,1,.3,1) .04s both}
.nw-shelf .nw-big-number{animation:nw-number-in .6s cubic-bezier(.16,1,.3,1) both}
.nw-shelf .nw-card-caption{position:absolute;left:0;right:0;bottom:-26px;text-align:center;font-size:9px;letter-spacing:.16em;color:var(--nw-text-3);opacity:0;transition:opacity .25s}
.nw-shelf .nw-card.is-side:hover .nw-card-caption{opacity:1}
.nw-shelf .nw-open-veil{position:absolute;left:0;right:0;bottom:0;height:74px;border-radius:0 0 3px 3px;background:linear-gradient(transparent,rgba(0,0,0,.52));display:flex;align-items:flex-end;justify-content:space-between;padding:0 14px 12px;color:#f7f2e8;font-size:9.5px;letter-spacing:.14em;opacity:0;transition:opacity .25s}
.nw-shelf .nw-card.is-hero:hover .nw-open-veil{opacity:1}
.nw-shelf .nw-gallery-hint{position:absolute;right:0;bottom:-8px;font-size:9px;letter-spacing:.16em;color:var(--nw-text-3)}
.nw-shelf .nw-footer{position:absolute;left:64px;right:56px;bottom:16px;display:flex;justify-content:space-between;font-size:8.5px;letter-spacing:.22em;color:var(--nw-text-3);z-index:10;pointer-events:none}
.nw-shelf-empty{flex:1;display:flex;align-items:center;padding:44px 64px}
.nw-shelf-empty-inner{max-width:720px}
.nw-shelf-empty-title{font-family:var(--nw-serif);font-size:92px;line-height:1.02;font-weight:600;margin:24px 0 0;letter-spacing:.02em}
.nw-shelf-empty-body{font-family:var(--nw-serif);margin:24px 0 0;max-width:24em;font-size:15px;line-height:1.95;color:var(--nw-text-2)}
.nw-shelf-loading{flex:1;display:flex;align-items:center;justify-content:center;gap:10px;color:var(--nw-text-2);font-size:12px;letter-spacing:.08em}
.nw-spinner{width:14px;height:14px;border-radius:50%;border:1.5px solid var(--nw-border);border-top-color:var(--nw-text-2);animation:nw-spin .8s linear infinite}
@keyframes nw-spin{to{transform:rotate(360deg)}}
@keyframes nw-pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes nw-rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes nw-cover-in{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
@keyframes nw-number-in{from{opacity:0;transform:scale(.94)}}
@keyframes nw-eq{0%,100%{transform:scaleY(.45)}50%{transform:scaleY(1)}}
@keyframes nw-breathe{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.06);opacity:.35}}
@keyframes nw-nib{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
@keyframes nw-writing-dot{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-2px)}}
@keyframes nw-writing-sweep{0%{transform:translateX(-110%)}100%{transform:translateX(400%)}}
@keyframes nw-writing-pen{0%{top:0;opacity:0}8%{opacity:.55}88%{opacity:.55}100%{top:calc(100% - 9px);opacity:0}}
@keyframes nw-writing-shimmer{0%{background-position:120% 0}100%{background-position:-120% 0}}

/* generated cover */
.nw-cover{position:relative;width:100%;height:100%;overflow:hidden;background:var(--cbg);color:var(--cink);container-type:inline-size;border-radius:3px}
.nw-cover-spine{position:absolute;left:0;top:0;bottom:0;width:5%;background:linear-gradient(90deg,rgba(0,0,0,.3),rgba(0,0,0,.04) 62%,transparent);z-index:6}
.nw-cover-edge{position:absolute;inset:0;box-shadow:inset 0 0 0 1px rgba(255,255,255,.09),inset 0 0 24px rgba(0,0,0,.08);z-index:7;pointer-events:none}
.nw-cover-mark{position:absolute;top:4.6%;left:7.2%;font-size:2.25cqw;letter-spacing:.34em;opacity:.5;z-index:5;font-weight:500}
.nw-cover-title{position:absolute;font-family:var(--nw-serif);font-weight:600;z-index:5;letter-spacing:.1em}
.nw-cover-title.is-vertical{top:9%;right:9%;writing-mode:vertical-rl;text-orientation:upright;font-size:8.3cqw;line-height:1.32}
.nw-cover-title.is-horizontal{left:8.5%;bottom:11%;right:8.5%;font-size:9.2cqw;line-height:1.34;letter-spacing:.05em}
.nw-cover-seal{position:absolute;right:8%;bottom:7%;width:7.4cqw;height:7.4cqw;display:grid;place-items:center;background:var(--caccent);color:#f8f1e4;font-family:var(--nw-serif);font-size:4.2cqw;line-height:1;border-radius:.6px;transform:rotate(-2deg);box-shadow:0 1px 3px rgba(0,0,0,.22);z-index:5}
.nw-cover-sheen{position:absolute;inset:0;background:linear-gradient(118deg,transparent 28%,rgba(255,255,255,.1) 47%,transparent 60%);z-index:4;opacity:.7}
.nw-cover-grain{position:absolute;inset:0;background-image:${NOISE};opacity:.34;mix-blend-mode:overlay;z-index:5;pointer-events:none}
.nw-cover-art{position:absolute;inset:0;overflow:hidden;z-index:2}
.nw-rain i{position:absolute;top:-6%;width:.28cqw;background:var(--cink);border-radius:99px;transform:rotate(9deg);opacity:.34}
.nw-sun{position:absolute;border-radius:50%;background:var(--cink);left:-15cqw;top:-13cqw;width:68cqw;height:68cqw;opacity:.94}
.nw-horizon{position:absolute;left:0;right:0;top:58%;height:1px;background:var(--cink);opacity:.22}
.nw-ring{position:absolute;border:1px solid var(--cink);border-radius:50%;right:-20cqw;top:-14cqw;width:64cqw;height:64cqw;opacity:.42}
.nw-ring.is-small{right:auto;top:auto;left:-14cqw;bottom:-18cqw;width:44cqw;height:44cqw;opacity:.24}
.nw-bird{position:absolute;left:14cqw;bottom:30cqw;width:26cqw;height:14cqw;opacity:.7}
.nw-bird path{fill:none;stroke:var(--cink);stroke-width:1.1;stroke-linecap:round}

/* workbench shell */
.nw-workbench{position:relative;display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;background:var(--nw-canvas);container-type:inline-size}
.nw-appbar{height:48px;flex:0 0 48px;display:flex;align-items:center;gap:8px;padding:0 16px;min-width:0;transition:padding-left .18s ease}
.nw-root.is-mac-titlebar .nw-appbar{padding-left:160px}
.nw-session-error{max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--nw-danger)}
.nw-appbar-title{font-size:13px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nw-appbar-sub{font-size:11px;color:var(--nw-text-3);white-space:nowrap}
.nw-appbar-right{display:flex;align-items:center;gap:6px;flex:0 0 auto}
.nw-appbar .nw-divider{width:1px;height:16px;background:var(--nw-border);margin:0 4px;flex:0 0 auto}
.nw-pill{height:26px;padding:0 10px;border-radius:999px;display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:500;background:var(--nw-hover);color:var(--nw-text-2);white-space:nowrap;transition:background .15s,color .15s}
.nw-pill:not(:disabled):hover{background:var(--nw-active);color:var(--nw-text-1)}
.nw-pill.is-writing{color:var(--nw-text-1)}
.nw-pill.is-waiting{color:var(--nw-warn)}
.nw-pill.is-error{color:var(--nw-danger)}
.nw-pill-dot{width:6px;height:6px;border-radius:50%;background:var(--nw-success);animation:nw-pulse 1.8s ease-in-out infinite}
.nw-pill.is-done .nw-pill-dot{animation:none}
.nw-pill.is-waiting .nw-pill-dot{background:var(--nw-warn)}
.nw-pill.is-error .nw-pill-dot{background:var(--nw-danger);animation:none}
.nw-eq{display:inline-flex;align-items:flex-end;gap:2px;height:10px;width:10px;flex:0 0 10px}
.nw-eq i{width:2px;border-radius:2px;background:currentColor;transform-origin:50% 100%;animation:nw-eq 1s ease-in-out infinite}
.nw-eq i:nth-child(1){height:40%;animation-delay:-.32s}
.nw-eq i:nth-child(2){height:100%;animation-delay:-.16s}
.nw-eq i:nth-child(3){height:65%}
.nw-body{flex:1 1 auto;min-height:0;display:flex;padding:4px 12px 12px 0;position:relative}
.nw-rail{width:64px;flex:0 0 64px;display:flex;flex-direction:column;align-items:center;gap:2px;padding-top:2px;position:relative;z-index:5}
.nw-rail-item{width:52px;height:50px;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:var(--nw-text-2);font-size:11px;line-height:1;transition:background .15s,color .15s}
.nw-rail-item:hover{color:var(--nw-text-1);background:var(--nw-hover)}
.nw-rail-item.is-active{background:var(--nw-active);color:var(--nw-text-1);font-weight:600}
.nw-work{flex:1 1 auto;min-width:0;min-height:0;display:flex;background:var(--nw-surface);border-radius:16px;box-shadow:var(--nw-shadow-card);overflow:hidden}
.nw-directory{width:280px;flex:0 0 280px;min-height:0;display:flex;flex-direction:column;background:var(--nw-aside);border-right:1px solid var(--nw-border)}
.nw-directory:not(.is-open){display:none}
.nw-dir-head{height:56px;flex:0 0 56px;display:flex;align-items:center;gap:8px;padding:0 16px}
.nw-dir-head h2{margin:0;font-size:15px;font-weight:600}
.nw-dir-count{font-size:11px;color:var(--nw-text-3);font-weight:400}
.nw-dir-search{margin:0 16px 10px;height:30px;flex:0 0 30px;border-radius:8px;background:var(--nw-surface);border:1px solid var(--nw-border);display:flex;align-items:center;gap:8px;padding:0 10px;color:var(--nw-text-3);font-size:12px}
.nw-dir-search input{flex:1 1 auto;min-width:0;border:0;outline:0;background:transparent;color:var(--nw-text-1);font:inherit;padding:0}
.nw-dir-list{flex:1 1 auto;min-height:0;overflow:auto;padding:2px 8px 8px}
.nw-group{position:relative;margin-bottom:6px}
.nw-group .nw-row{padding-left:36px;padding-right:12px}
.nw-group::before{content:"";position:absolute;left:28px;top:28px;bottom:6px;width:1px;background:var(--nw-border);pointer-events:none}
.nw-group-head{height:28px;display:flex;align-items:center;gap:6px;padding:0 12px;color:var(--nw-text-2);font-size:11px;font-weight:600;width:100%;text-align:left;position:relative;z-index:1}
.nw-group-head .nw-group-count{margin-left:auto;min-width:22px;text-align:right;color:var(--nw-text-3);font-weight:400}
.nw-row{height:32px;display:flex;align-items:center;gap:8px;padding:0 12px;border-radius:8px;font-size:13px;color:var(--nw-text-1);transition:background .12s;width:100%;text-align:left}
.nw-row:hover{background:var(--nw-hover)}
.nw-row.is-active{background:var(--nw-active);font-weight:600}
.nw-row-no{width:40px;flex:0 0 40px;font-size:11px;color:var(--nw-text-3);font-variant-numeric:tabular-nums}
.nw-row-label{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nw-row-meta{min-width:44px;text-align:right;font-size:10px;color:var(--nw-text-3);font-variant-numeric:tabular-nums;padding-right:2px}
.nw-dot{width:6px;height:6px;border-radius:50%;flex:0 0 auto}
.nw-dot.is-done{background:var(--nw-success)}
.nw-dot.is-plan{background:var(--nw-warn)}
.nw-dot.is-idle{background:var(--nw-border-strong)}
.nw-dot.is-writing{background:var(--nw-text-1);animation:nw-pulse 1.4s ease-in-out infinite}
.nw-row-meta.is-live{color:var(--nw-text-1);font-weight:500}
.nw-content{flex:1 1 auto;min-width:0;min-height:0;display:flex;flex-direction:column;background:var(--nw-surface)}
.nw-ctoolbar{height:56px;flex:0 0 56px;display:flex;align-items:center;gap:10px;padding:0 16px 0 20px;border-bottom:1px solid var(--nw-border);min-width:0}
.nw-ctoolbar.is-editing{height:48px;flex:0 0 48px}
.nw-ctoolbar-lead{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:3px}
.nw-crumbs{font-size:11px;color:var(--nw-text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nw-crumbs b{color:var(--nw-text-2);font-weight:400}
.nw-ctitle{font-family:var(--nw-serif);font-size:17px;font-weight:600;line-height:1.25;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nw-ctools{display:flex;align-items:center;gap:6px;margin-left:auto;flex:0 0 auto}
.nw-seg{display:flex;height:28px;padding:2px;border-radius:8px;background:var(--nw-hover);gap:2px;max-width:100%;overflow-x:auto;scrollbar-width:none}
.nw-seg::-webkit-scrollbar{display:none}
.nw-seg button{flex:0 0 auto;padding:0 10px;border-radius:6px;font-size:11px;font-weight:500;color:var(--nw-text-2);white-space:nowrap;transition:color .15s,background .15s}
.nw-seg button:not(.is-active):hover{color:var(--nw-text-1)}
/* The selected tab is a surface change, not a stroke: no black underline. */
.nw-seg button.is-active{background:var(--nw-surface);color:var(--nw-text-1);font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.nw-cbody{flex:1 1 auto;min-height:0;overflow:auto;position:relative}
.nw-reading{width:min(38em,100%);max-width:38em;margin:0 auto;padding:40px 0 80px;font-size:16.5px}
.nw-reading-kicker{font-size:11px;color:var(--nw-text-3);margin-bottom:14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.nw-reading-title{font-family:var(--nw-serif);margin:0 0 26px;font-size:26px;line-height:1.32;font-weight:600;letter-spacing:.02em}
.nw-reading p{font-family:var(--nw-serif);margin:0 0 1.05em;font-size:inherit;line-height:1.98;letter-spacing:.01em;color:var(--nw-text-1)}
.nw-reading h2{font-family:var(--nw-serif);margin:30px 0 10px;font-size:16px;font-weight:600}
.nw-reading .nw-quote{font-family:var(--nw-serif);color:var(--nw-text-2);font-size:15.5px;line-height:1.95;padding-left:14px;border-left:2px solid var(--nw-border)}
.nw-editor-wrap{width:min(38em,100%);max-width:38em;margin:0 auto;padding:40px 0 80px;font-size:16.5px}
.nw-editor{display:block;width:100%;min-height:60vh;padding:0;border:0;outline:0;background:transparent;color:var(--nw-text-1);font-family:var(--nw-serif);font-size:16.5px;line-height:1.98;letter-spacing:.01em;white-space:pre-wrap;overflow-wrap:break-word;word-break:break-word;resize:none}
.nw-editor.is-mono{font-family:var(--nw-mono);font-size:13px;line-height:1.7;white-space:pre;overflow-wrap:normal;overflow-x:auto}
/* Manuscript editing: the page is the surface, so the editor has no frame,
   no focus ring and no inner scrollbar. field-sizing lets the text grow to
   the content so only the page column scrolls. */
.nw-page-edit .nw-reading-edit{padding:44px 0 96px;position:relative}
.nw-page-edit:focus-within .nw-reading-edit::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:color-mix(in oklab,var(--nw-text-2) 70%,transparent);pointer-events:none}
.nw-editor-page{display:block;width:100%;min-height:calc(100vh - 360px);padding:0 0 48px;border:0;outline:0;background:transparent;color:var(--nw-text-1);font-family:var(--nw-serif);font-size:16.5px;line-height:1.98;letter-spacing:.01em;white-space:pre-wrap;overflow-wrap:break-word;word-break:break-word;resize:none;field-sizing:content;caret-color:var(--nw-text-1)}
.nw-root .nw-editor-page:focus-visible{outline:0}
.nw-edit-title{display:block;width:100%;margin:0 0 26px;padding:0;border:0;outline:0;background:transparent;color:var(--nw-text-1);font-family:var(--nw-serif);font-size:26px;font-weight:600;line-height:1.32;letter-spacing:.02em;caret-color:var(--nw-text-1)}
.nw-root .nw-edit-title:focus-visible{outline:0}
.nw-edit-title::placeholder{color:var(--nw-text-3);font-weight:400;opacity:1}
.nw-edit-state{display:inline-flex;align-items:center;gap:6px}
.nw-edit-state i{width:5px;height:5px;border-radius:50%;background:var(--nw-warn);display:block}
.nw-edit-state.is-saved{color:var(--nw-text-3)}
.nw-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-height:100%;padding:40px;text-align:center;color:var(--nw-text-2)}
.nw-empty-title{font-family:var(--nw-serif);margin:0;font-size:20px;line-height:1.35;font-weight:600;color:var(--nw-text-1)}
.nw-empty-body{max-width:440px;margin:0;font-size:13px;line-height:1.8}
.nw-empty-actions{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:8px}
.nw-writing-strip{display:inline-flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;max-width:100%;margin-top:4px;padding:6px 10px 6px 12px;border-radius:999px;background:var(--nw-hover);font-size:12px;color:var(--nw-text-2)}
.nw-writing-strip .nw-eq{color:var(--nw-text-1)}
.nw-writing-strip .nw-btn{padding:0 8px;color:var(--nw-text-1)}

/* AI writing: the chapter page is the wait state, not a greyed-out button. */
.nw-writing{width:min(38em,100%);max-width:38em;margin:0 auto;padding:44px 0 80px;min-height:100%}
.nw-writing-head{display:flex;align-items:flex-start;gap:14px}
.nw-writing-mark{width:40px;height:40px;border-radius:50%;flex:0 0 auto;display:grid;place-items:center;position:relative;background:var(--nw-hover);color:var(--nw-text-1)}
.nw-writing-mark::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:1px solid color-mix(in oklab,var(--nw-text-1) 16%,transparent);animation:nw-breathe 2.6s ease-in-out infinite}
.nw-writing-mark svg{animation:nw-nib 3.2s ease-in-out infinite}
.nw-writing-copy{min-width:0;padding-top:1px}
.nw-writing-title{font-family:var(--nw-serif);font-size:22px;line-height:1.45;font-weight:600;letter-spacing:.02em;margin:0;display:flex;align-items:baseline;flex-wrap:wrap;gap:4px}
.nw-writing-dots{display:inline-flex;gap:3px;padding-left:2px;align-self:center}
.nw-writing-dots i{width:4px;height:4px;border-radius:50%;background:var(--nw-text-2);animation:nw-writing-dot 1.3s ease-in-out infinite}
.nw-writing-dots i:nth-child(2){animation-delay:.16s}
.nw-writing-dots i:nth-child(3){animation-delay:.32s}
.nw-writing-sub{margin:7px 0 0;font-size:12.5px;line-height:1.85;color:var(--nw-text-2)}
.nw-writing-bar{margin:24px 0 0;height:3px;border-radius:999px;background:var(--nw-hover);overflow:hidden}
.nw-writing-bar i{display:block;height:100%;width:34%;border-radius:999px;background:var(--nw-text-2);opacity:.65;animation:nw-writing-sweep 2.4s cubic-bezier(.45,0,.55,1) infinite}
.nw-writing-meta{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-top:10px;font-size:11px;color:var(--nw-text-3);font-variant-numeric:tabular-nums}
.nw-writing-clock{color:var(--nw-text-2)}
.nw-writing-sep{color:var(--nw-border-strong)}
.nw-writing-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-top:22px}
.nw-writing.is-waiting .nw-writing-mark{color:var(--nw-warn);background:color-mix(in oklab,var(--nw-warn) 11%,transparent)}
.nw-writing.is-waiting .nw-writing-bar i{width:100%;background:var(--nw-warn);opacity:.5;animation:none}
.nw-writing.is-error .nw-writing-mark{color:var(--nw-danger);background:color-mix(in oklab,var(--nw-danger) 10%,transparent)}
.nw-writing.is-error .nw-writing-mark::after{border-color:color-mix(in oklab,var(--nw-danger) 22%,transparent);animation:none}
.nw-skel{margin-top:34px;display:grid;gap:16px;padding-left:22px;position:relative}
.nw-skel::before{content:"";position:absolute;left:6px;top:2px;bottom:2px;width:1px;background:var(--nw-border)}
.nw-skel::after{content:"";position:absolute;left:2px;top:0;width:9px;height:9px;border-radius:50%;background:var(--nw-text-2);opacity:.55;box-shadow:0 0 0 4px var(--nw-hover);animation:nw-writing-pen 5.6s cubic-bezier(.5,0,.4,1) infinite}
.nw-skel p{margin:0;display:grid;gap:9px}
.nw-skel i{display:block;height:11px;border-radius:4px;background:linear-gradient(90deg,color-mix(in oklab,var(--nw-text-1) 6%,transparent) 0%,color-mix(in oklab,var(--nw-text-1) 14%,transparent) 42%,color-mix(in oklab,var(--nw-text-1) 6%,transparent) 100%);background-size:240% 100%;animation:nw-writing-shimmer 2.8s ease-in-out infinite}
/* The same writing scene, compacted for the right sidebar panel. */
.nw-p2-writing{margin:0 0 12px;padding:13px 14px 15px;border-radius:12px;background:linear-gradient(180deg,var(--nw-surface),var(--nw-hover));border:1px solid var(--nw-border)}
.nw-writing.is-compact{width:100%;max-width:none;min-height:0;padding:0}
.nw-writing.is-compact .nw-writing-head{gap:10px}
.nw-writing.is-compact .nw-writing-mark{width:32px;height:32px}
.nw-writing.is-compact .nw-writing-title{font-size:16px;line-height:1.45}
.nw-writing.is-compact .nw-writing-sub{font-size:11px;line-height:1.7;margin-top:5px}
.nw-writing.is-compact .nw-writing-bar{margin-top:14px;height:2px}
.nw-writing.is-compact .nw-skel{margin-top:16px;gap:9px;padding-left:15px}
.nw-writing.is-compact .nw-skel::before{left:4px}
.nw-writing.is-compact .nw-skel::after{left:0;width:7px;height:7px}
.nw-writing.is-compact .nw-skel p{gap:7px}
.nw-writing.is-compact .nw-skel i{height:8px;border-radius:3px}
.nw-panel{width:340px;flex:0 0 340px;margin-left:8px;min-height:0;display:flex;flex-direction:column;background:var(--nw-surface);border-radius:16px;box-shadow:var(--nw-shadow-card);overflow:hidden}
.nw-panel:not(.is-open){display:none}
.nw-panel-head{height:48px;flex:0 0 48px;display:flex;align-items:center;gap:6px;padding:0 12px 0 18px;border-bottom:1px solid var(--nw-border)}
.nw-panel-title{font-size:12px;font-weight:600;color:var(--nw-text-2)}
.nw-panel-tabs{display:flex;gap:2px}
.nw-panel-tab{height:28px;padding:0 10px;border-radius:7px;display:flex;align-items:center;font-size:12px;color:var(--nw-text-2)}
.nw-panel-tab.is-active{background:var(--nw-active);color:var(--nw-text-1);font-weight:600}
.nw-panel-body{flex:1 1 auto;min-height:0;overflow:auto;padding:16px 18px 28px}
.nw-sec{padding-bottom:16px;margin-bottom:16px;border-bottom:1px solid var(--nw-border)}
.nw-sec:last-child{border-bottom:0;margin-bottom:0;padding-bottom:0}
.nw-sec h4{margin:0 0 10px;font-size:11px;font-weight:600;color:var(--nw-text-3);letter-spacing:.02em}
.nw-beats{margin:0;padding:0;list-style:none}
.nw-beats li{position:relative;padding:0 0 0 14px;margin:0 0 10px;font-size:12px;line-height:1.7;color:var(--nw-text-2)}
.nw-beats li::before{content:"";position:absolute;left:0;top:7px;width:5px;height:5px;border-radius:50%;background:var(--nw-border-strong)}
.nw-beats li b{color:var(--nw-text-1);font-weight:600}
.nw-tags{display:flex;flex-wrap:wrap;gap:6px}

/* overview */
.nw-ov{max-width:1100px;margin:0 auto;padding:28px 40px 56px}
.nw-ov-hero{display:grid;grid-template-columns:96px minmax(0,1fr);column-gap:28px;row-gap:14px;align-items:start;padding-bottom:20px;border-bottom:1px solid var(--nw-border)}
.nw-ov-cover{grid-column:1;grid-row:1;width:96px;height:144px;border-radius:3px;overflow:hidden;box-shadow:0 12px 28px -14px rgba(0,0,0,.4)}
.nw-ov-main{grid-column:2;grid-row:1;min-width:0}
.nw-ov-title{font-family:var(--nw-serif);margin:0;font-size:28px;line-height:1.25;font-weight:600;letter-spacing:.02em}
.nw-ov-meta{display:flex;align-items:center;gap:6px;margin-top:10px;flex-wrap:wrap}
.nw-ov-summary{grid-column:1 / -1;min-width:0}
.nw-ov-desc{font-family:var(--nw-serif);margin:0;font-size:15px;line-height:1.9;color:var(--nw-text-2);letter-spacing:.01em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.nw-ov-summary.is-open .nw-ov-desc{display:block;overflow:visible;-webkit-line-clamp:unset}
.nw-ov-more{display:inline-flex;align-items:center;gap:2px;margin-top:6px;padding:0 0 1px;border-bottom:1px solid transparent;font-size:11px;letter-spacing:.03em;color:var(--nw-text-3)}
.nw-ov-more:hover{color:var(--nw-text-1);border-color:var(--nw-text-3)}
.nw-ov-actions{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap}
.nw-progress{margin-top:18px}
.nw-bar{height:6px;border-radius:999px;background:var(--nw-hover);overflow:hidden}
.nw-bar i{display:block;height:100%;border-radius:999px;background:var(--nw-text-1)}
.nw-progress-labels{display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:var(--nw-text-3)}
.nw-stats3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:20px 0}
.nw-bigstat{background:var(--nw-hover);border-radius:10px;padding:14px 16px 12px}
.nw-bigstat b{display:block;font-size:22px;line-height:1;font-weight:600;font-variant-numeric:tabular-nums}
.nw-bigstat b em{font-style:normal;font-size:11px;color:var(--nw-text-3);margin-left:6px}
.nw-bigstat span{display:block;margin-top:8px;font-size:11px;color:var(--nw-text-3)}
.nw-nextstep{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:12px;background:var(--nw-hover);margin:4px 0 24px}
.nw-nextstep-icon{width:34px;height:34px;border-radius:50%;background:var(--nw-surface);display:grid;place-items:center;color:var(--nw-text-2);flex:0 0 auto}
.nw-nextstep-text{flex:1 1 auto;min-width:0}
.nw-nextstep-text b{display:block;font-size:14px}
.nw-nextstep-text p{margin:3px 0 0;font-size:12px;color:var(--nw-text-2)}
.nw-section{margin-top:24px}
.nw-section h2{margin:0 0 12px;font-size:15px;font-weight:600}
.nw-sec-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px}
.nw-sec-head h2{margin:0}
.nw-memtabs{flex:0 0 auto}
.nw-memcount{font-size:10px;color:var(--nw-text-3);margin-left:5px;font-variant-numeric:tabular-nums}
.nw-seg button.is-active .nw-memcount{color:var(--nw-text-2)}
.nw-mem-empty{margin:4px 0 0;padding:8px 0}
.nw-frow-list,.nw-states{display:flex;flex-direction:column}
.nw-frow{display:grid;grid-template-columns:84px minmax(0,1fr) auto;gap:12px;align-items:start;padding:12px;border-bottom:1px solid var(--nw-border)}
.nw-frow:last-child{border-bottom:0}
.nw-frow-id{font-family:var(--nw-mono);font-size:10px;color:var(--nw-text-3);padding-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nw-frow-desc{font-family:var(--nw-serif);font-size:14px;line-height:1.7;margin:0;color:var(--nw-text-1)}
.nw-frow-meta{display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:4px;font-size:11px;color:var(--nw-text-3)}
.nw-frow .nw-tag{white-space:nowrap}
.nw-state-row{display:grid;grid-template-columns:96px minmax(0,1fr);gap:16px;align-items:start;padding:12px;border-bottom:1px solid var(--nw-border)}
.nw-state-row:last-child{border-bottom:0}
.nw-state-name{font-size:13px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nw-state-dims{display:flex;flex-wrap:wrap;gap:6px}
.nw-state-chip{display:inline-flex;align-items:baseline;gap:6px;padding:4px 8px;border-radius:6px;background:var(--nw-hover);font-size:11px;max-width:100%}
.nw-state-key{color:var(--nw-text-3);white-space:nowrap}
.nw-state-value{font-family:var(--nw-serif);font-size:13px;color:var(--nw-text-1);overflow-wrap:anywhere}
.nw-state-ch{font-size:10px;color:var(--nw-text-3);white-space:nowrap}
.nw-recent{display:flex;flex-direction:column}
.nw-rrow{display:flex;align-items:center;gap:12px;height:40px;border-radius:8px;padding:0 12px;width:100%;text-align:left}
.nw-rrow:hover{background:var(--nw-hover)}
.nw-rrow-no{width:52px;flex:0 0 52px;font-size:11px;color:var(--nw-text-3);font-variant-numeric:tabular-nums}
.nw-rrow-title{flex:1 1 auto;min-width:0;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nw-rrow-words{flex:0 0 auto;font-size:11px;color:var(--nw-text-3);font-variant-numeric:tabular-nums;white-space:nowrap;text-align:right}
.nw-rrow > .nw-tag{flex:0 0 auto}
.nw-info{display:grid;grid-template-columns:1fr 1fr;gap:10px 28px}

/* menus, dialog, toast */
.nw-layer{position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.18);display:grid;place-items:center;padding:24px}
.nw-dialog{width:min(420px,100%);background:var(--nw-surface);border-radius:16px;box-shadow:var(--nw-shadow-float);padding:24px}
.nw-dialog-title{font-family:var(--nw-serif);margin:0;font-size:19px;font-weight:600}
.nw-dialog-body{margin:10px 0 0;font-size:13px;line-height:1.75;color:var(--nw-text-2)}
.nw-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:24px}
.nw-pro-card{margin-top:18px;padding:15px;border:1px solid var(--nw-border-strong);border-radius:14px;background:color-mix(in oklab,var(--nw-text-1) 3.5%,transparent);display:flex;flex-direction:column;gap:11px}
.nw-pro-title{margin:0;font-size:14px;font-weight:600;letter-spacing:.02em}
.nw-pro-body{margin:0;font-size:12px;line-height:1.8;color:var(--nw-text-2)}
.nw-pro-note{margin:0;font-size:10.5px;line-height:1.7;color:var(--nw-text-3)}
.nw-pro-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.nw-pro-primary{display:inline-flex;align-items:center;justify-content:center;height:32px;padding:0 13px;border-radius:999px;background:var(--nw-primary);color:var(--nw-primary-fg);font-size:11.5px;letter-spacing:.02em;transition:transform .2s,box-shadow .2s}
.nw-pro-primary:hover{transform:translateY(-1px);box-shadow:0 6px 14px -8px rgba(0,0,0,.4)}
.nw-pro-site{display:inline-flex;align-items:center;gap:5px;height:32px;padding:0 11px;border-radius:999px;border:1px solid var(--nw-border);font-size:11.5px;color:var(--nw-text-2);transition:color .2s,border-color .2s}
.nw-pro-site:hover{color:var(--nw-text-1);border-color:var(--nw-border-strong)}
.nw-footer-contact{pointer-events:auto;background:none;border:0;color:inherit;font:inherit;letter-spacing:inherit;cursor:pointer;padding:0;transition:color .2s}
.nw-footer-contact:hover{color:var(--nw-text-1)}
.nw-contact-dialog{position:relative;width:min(620px,100%);max-height:calc(100vh - 48px);overflow:auto;padding:28px}
.nw-contact-close{position:absolute;right:14px;top:14px;width:30px;height:30px;display:grid;place-items:center;border-radius:50%;color:var(--nw-text-2);transition:background .2s,color .2s}
.nw-contact-close:hover{background:color-mix(in oklab,var(--nw-text-1) 7%,transparent);color:var(--nw-text-1)}
.nw-contact-head{display:flex;align-items:center;gap:16px;padding-right:32px}
.nw-contact-avatar{width:66px;height:66px;border-radius:50%;object-fit:cover;border:1px solid var(--nw-border);flex:0 0 auto}
.nw-contact-name{font-family:var(--nw-serif);margin:0;font-size:24px;font-weight:600}
.nw-contact-role{display:inline-block;margin-top:6px;padding:3px 10px;border:1px solid var(--nw-border-strong);border-radius:999px;font-size:11px;letter-spacing:.04em;color:var(--nw-text-2)}
.nw-contact-bio{margin:18px 0 0;font-size:13.5px;line-height:1.95;color:var(--nw-text-2)}
.nw-contact-github{display:inline-flex;align-items:center;gap:6px;margin-top:14px;font-size:12px;letter-spacing:.02em;color:var(--nw-text-1);border-bottom:1px solid var(--nw-border);padding-bottom:2px;transition:border-color .2s}
.nw-contact-github:hover{border-color:var(--nw-text-2)}
.nw-contact-hint{margin-top:18px;font-size:11px;letter-spacing:.05em;color:var(--nw-text-3)}
.nw-contact-qrs{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px}
.nw-qr-card{margin:0;padding:12px;border:1px solid var(--nw-border);border-radius:14px;background:color-mix(in oklab,var(--nw-text-1) 3.5%,transparent);display:flex;flex-direction:column;align-items:center;gap:10px}
.nw-qr-img{width:100%;max-width:220px;aspect-ratio:1;display:block;background:#fff;border-radius:8px;padding:6px;object-fit:contain}
.nw-qr-card figcaption{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:12px;color:var(--nw-text-1)}
.nw-qr-card figcaption span{font-size:10px;letter-spacing:.08em;color:var(--nw-text-3)}
.nw-contact-foot{margin:18px 0 0;text-align:center;font-family:var(--nw-serif);font-size:12px;letter-spacing:.08em;color:var(--nw-text-3)}
@media (max-width:560px){.nw-contact-qrs{grid-template-columns:1fr}.nw-qr-img{max-width:200px}.nw-contact-dialog{padding:22px}}
.nw-menu{position:fixed;z-index:90;min-width:180px;padding:4px;border-radius:14px;background:var(--nw-surface);border:1px solid var(--nw-border);box-shadow:var(--nw-shadow-float)}
.nw-menu-item{width:100%;display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:8px;font-size:12px;text-align:left;color:var(--nw-text-1)}
.nw-menu-item:hover{background:var(--nw-hover)}
.nw-menu-item.is-danger{color:var(--nw-danger)}
.nw-toast{position:fixed;right:20px;bottom:20px;z-index:95;display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;background:var(--nw-surface);border:1px solid var(--nw-border);box-shadow:var(--nw-shadow-float);font-size:12px;color:var(--nw-text-1)}

/* narrow workbench */
@container (max-width:1180px){
  .nw-panel{display:none}
  .nw-panel.is-open{display:flex;position:absolute;right:0;top:4px;bottom:0;z-index:40;margin-left:0;box-shadow:var(--nw-shadow-float)}
}
@container (max-width:900px){
  .nw-directory{display:none}
  .nw-directory.is-open{display:flex;position:absolute;left:64px;top:4px;bottom:0;z-index:45;box-shadow:var(--nw-shadow-float)}
  .nw-work{overflow:visible}
  .nw-content{border-radius:16px;overflow:hidden}
  .nw-appbar-sub{display:none}
}
@container (max-width:720px){
  .nw-rail{width:56px;flex-basis:56px}
  .nw-rail-item{width:44px;height:46px}
  .nw-rail-item .nw-rail-label{display:none}
  .nw-appbar{padding:0 8px 0 10px;gap:4px}
  .nw-appbar .nw-hide-narrow{display:none}
  .nw-page-edit .nw-reading-edit{padding:32px 24px 64px}
  /* Keep the tab bar instead of turning it into a select. The toolbar wraps:
     breadcrumb/title on one row, tabs and actions below it. */
  .nw-ctoolbar{height:auto;min-height:56px;flex-wrap:wrap;padding:8px 12px;row-gap:6px;column-gap:8px}
  .nw-ctoolbar-lead{flex:1 1 100%}
  .nw-ctools{flex:1 1 100%;justify-content:flex-end;flex-wrap:wrap;margin-left:0}
  .nw-ctoolbar.is-editing{height:48px;min-height:48px;flex-wrap:nowrap;padding:0 12px}
  .nw-ctoolbar.is-editing .nw-ctoolbar-lead{flex:1 1 auto}
  .nw-ctools .nw-hide-narrow{display:none}
  .nw-reading,.nw-editor-wrap,.nw-writing{padding:32px 24px 64px}
  .nw-frow{grid-template-columns:1fr auto}
  .nw-frow-id{grid-column:1 / -1;padding-top:0}
  .nw-state-row{grid-template-columns:1fr}
  .nw-ov{padding:24px 24px 48px}
  .nw-ov-hero{grid-template-columns:72px minmax(0,1fr);column-gap:18px}
  .nw-ov-cover{width:72px;height:108px}
  .nw-body{padding:4px 8px 8px 0}
  .nw-directory.is-open{left:56px}
}

/* narrow shelf */
@container (max-width:1180px){
  .nw-shelf{--shelf-info-h:370px}
  .nw-shelf .nw-stage{grid-template-columns:minmax(0,470px) minmax(0,1fr);padding:36px 40px 36px 48px}
  .nw-shelf .nw-book-title{font-size:54px}
  .nw-shelf .nw-card.is-hero{width:270px;height:405px;margin:-202px 0 0 -135px}
  .nw-shelf .nw-card.is-side{width:150px;height:225px;margin-top:-100px}
  .nw-shelf .nw-card.is-left{left:8px}
  .nw-shelf .nw-card.is-right{right:28px}
  .nw-shelf .nw-big-number{font-size:210px;top:-30px}
  .nw-shelf .nw-footer{left:48px;right:40px}
}
@container (max-width:900px){
  .nw-shelf .nw-stage{grid-template-columns:1fr;grid-template-rows:auto auto auto;grid-template-areas:"copy" "gallery" "index";padding:22px 32px 24px;overflow:auto}
  .nw-shelf .nw-copy{height:auto;overflow:visible;padding-right:0}
  .nw-shelf .nw-index{padding:18px 0 0;max-height:270px}
  .nw-shelf .nw-index-list{max-height:220px}
  .nw-shelf .nw-book-title{font-size:50px;margin-top:14px}
  .nw-shelf .nw-synopsis{max-width:34em}
  .nw-shelf .nw-gallery{height:430px;margin-top:14px}
  .nw-shelf .nw-card.is-hero{width:220px;height:330px;margin:-165px 0 0 -110px;top:48%}
  .nw-shelf .nw-card.is-side{width:120px;height:180px;margin-top:-82px}
  .nw-shelf .nw-big-number{font-size:150px;right:-6px;top:-14px}
  .nw-shelf .nw-glow{width:420px;height:420px;margin:-210px 0 0 -210px}
  .nw-shelf .nw-footer{display:none}
  .nw-root.is-mac-titlebar .nw-topbar{padding-left:160px}
.nw-topbar{padding:0 24px;height:46px;flex-basis:46px}
}
@container (max-width:620px){
  .nw-topbar-actions .nw-pro-entry.nw-hide-narrow{display:none}
  .nw-shelf .nw-stage{padding:16px 22px 22px}
  .nw-shelf .nw-book-title{font-size:38px}
  .nw-shelf .nw-synopsis{font-size:13px;line-height:1.85;margin-top:16px}
  .nw-shelf .nw-meta{font-size:10px}
  .nw-shelf .nw-actions{margin-top:22px;gap:14px}
  .nw-shelf .nw-gallery{height:360px}
  .nw-shelf .nw-card.is-hero{width:184px;height:276px;margin:-128px 0 0 -92px}
  .nw-shelf .nw-card.is-side{display:none}
  .nw-shelf .nw-big-number{font-size:120px}
  .nw-shelf .nw-irow{height:42px}
  .nw-shelf-empty{padding:24px 22px}
  .nw-shelf-empty-title{font-size:52px}
}

/* structured content */
.nw-md-list,.nw-reading-list{margin:10px 0 0;padding-left:1.3em;font-family:var(--nw-serif);font-size:15.5px;line-height:1.9;color:var(--nw-text-1)}
.nw-md-list li,.nw-reading-list li{margin:4px 0}
.nw-reading h3{margin:22px 0 8px;font-size:15px;font-weight:600}
.nw-field{padding:10px 0;border-bottom:1px solid var(--nw-border)}
.nw-field:last-child{border-bottom:0}
.nw-field-label{font-size:11px;color:var(--nw-text-3);letter-spacing:.04em;margin-bottom:4px}
.nw-field-value{font-family:var(--nw-serif);font-size:15.5px;line-height:1.9;white-space:pre-wrap}
.nw-outline-volume{padding:16px 0;border-bottom:1px solid var(--nw-border)}
.nw-outline-volume:last-child{border-bottom:0}
.nw-outline-volume h3{margin:0 0 6px;font-size:16px;font-weight:600}
.nw-outline-arc{margin-top:10px;padding-left:12px;border-left:1px solid var(--nw-border)}
.nw-outline-arc strong{font-size:13px}
.nw-premise-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.nw-premise-card{background:var(--nw-hover);border-radius:10px;padding:16px}
.nw-premise-card h3{margin:0 0 10px;font-size:14px;font-weight:600}
.nw-premise-field{padding:8px 0;border-bottom:1px solid var(--nw-border)}
.nw-premise-field:last-child{border-bottom:0}
.nw-premise-key{font-size:10px;color:var(--nw-text-3);letter-spacing:.04em}
.nw-premise-value{font-family:var(--nw-serif);font-size:14.5px;line-height:1.8;margin-top:3px;white-space:pre-wrap}
.nw-pre{margin:0;font-family:var(--nw-mono);font-size:12.5px;line-height:1.7;white-space:pre-wrap;word-break:break-word}
.nw-memory-row{display:flex;align-items:center;gap:12px;min-height:44px;padding:8px 12px;border-radius:8px;text-align:left;width:100%}
.nw-memory-row:hover{background:var(--nw-hover)}
.nw-scene{padding:12px 0;border-bottom:1px solid var(--nw-border)}
.nw-scene:last-child{border-bottom:0}
.nw-scene-head{font-size:14px;font-weight:600;margin-bottom:6px}
.nw-scene-text{font-family:var(--nw-serif);font-size:14.5px;line-height:1.85;margin:6px 0 0;color:var(--nw-text-2)}
.nw-memory-row .nw-rrow-title{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:12.5px;line-height:1.6;font-family:var(--nw-serif)}


/* context panel chat */
.nw-chat{display:flex;flex-direction:column;height:100%;min-height:0}
.nw-chat-scroll{flex:1 1 auto;min-height:0;overflow:auto;padding:14px 16px 24px}
.nw-chat-row{margin:0 0 12px}
.nw-chat-role{font-size:10px;letter-spacing:.12em;color:var(--nw-text-3);margin-bottom:4px}
.nw-chat-text{font-family:var(--nw-serif);font-size:14px;line-height:1.85;white-space:pre-wrap;word-break:break-word}
.nw-chat-row.is-user .nw-chat-text{font-family:var(--nw-font);font-size:13px;background:var(--nw-hover);border-radius:8px;padding:8px 10px}
.nw-chat-row.is-tool .nw-chat-text{font-family:var(--nw-mono);font-size:11px;color:var(--nw-text-3)}
.nw-chat-hint{flex:0 0 auto;padding:8px 14px;border-top:1px solid var(--nw-border);font-size:11px;color:var(--nw-text-3)}
.nw-chat-empty{margin:auto;padding:24px;text-align:center;color:var(--nw-text-3);font-size:12px}
/* right-sidebar book cockpit: stage-aware board, reader, live sync */
.nw-p2{display:flex;flex-direction:column;height:100%;min-height:0;position:relative;background:var(--nw-surface);color:var(--nw-text-1);font-family:var(--nw-font);container-type:inline-size;container-name:nw-p2}
.nw-p2 *{box-sizing:border-box}
.nw-p2 button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.nw-p2 svg{display:block;flex:0 0 auto}
.nw-p2-head{flex:0 0 auto;border-bottom:1px solid var(--nw-border);background:linear-gradient(180deg,color-mix(in oklab,var(--nw-text-1) 2%,var(--nw-surface)),var(--nw-surface))}
.nw-p2-head-inner{display:flex;align-items:flex-start;gap:10px;padding:12px 13px 9px;width:100%;max-width:1086px;margin:0 auto}
.nw-p2-cover{width:38px;height:56px;flex:0 0 38px;border-radius:3px;overflow:hidden;box-shadow:0 7px 16px -9px rgba(0,0,0,.42)}
.nw-p2-id{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:3px}
.nw-p2-titlerow{display:flex;align-items:center;gap:7px;min-width:0}
.nw-p2-title{font-family:var(--nw-serif);font-size:16px;line-height:1.25;font-weight:600;margin:0;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:.01em}
.nw-p2-meta{display:flex;flex-wrap:wrap;align-items:center;gap:0 7px;font-size:10.5px;line-height:1.55;color:var(--nw-text-3);font-variant-numeric:tabular-nums;min-width:0}
.nw-p2-meta > span{white-space:nowrap;min-width:0;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.nw-p2-live{display:inline-flex;align-items:center;gap:4px;color:var(--nw-text-2)}
.nw-p2-live.is-busy{color:var(--nw-text-1)}
.nw-p2-live.is-fresh{color:var(--nw-success)}
.nw-p2-pulse{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--nw-success);animation:nw-pulse 1.6s ease-in-out infinite;flex:0 0 6px}
.nw-p2-synced{color:var(--nw-text-3);white-space:nowrap}
.nw-p2-steps{display:flex;align-items:center;gap:0;margin-top:3px;overflow:hidden;min-width:0}
.nw-p2-step{display:flex;align-items:center;gap:5px;font-size:9.5px;color:var(--nw-text-3);white-space:nowrap;flex:0 0 auto;line-height:1.4}
.nw-p2-step + .nw-p2-step{margin-left:4px}
.nw-p2-step:not(:last-child)::after{content:"";width:13px;height:1px;background:var(--nw-border);margin-left:4px;flex:0 0 13px}
.nw-p2-step.is-done{color:var(--nw-text-2)}
.nw-p2-step.is-active{color:var(--nw-text-1);font-weight:600}
.nw-p2-tools{display:flex;align-items:center;gap:1px;flex:0 0 auto;margin-left:auto;margin-top:-2px}
.nw-p2 .is-spinning svg{animation:nw-spin .8s linear infinite}
.nw-p2-scroll{flex:1 1 auto;min-height:0;overflow:auto;padding:12px 13px 22px;overscroll-behavior:contain}
.nw-p2-grid{display:flex;flex-direction:column;gap:15px;min-width:0}
.nw-p2-main,.nw-p2-aside{display:flex;flex-direction:column;gap:15px;min-width:0}
.nw-p2-only-wide{display:none}

/* next step */

/* sections */
.nw-p2-crows{display:flex;flex-direction:column;min-width:0}
.nw-p2-checkrow{display:flex;align-items:flex-start;gap:7px;text-align:left;width:100%;padding:5.5px 0;border-bottom:1px solid var(--nw-border);min-width:0}
.nw-p2-checkrow:last-child{border-bottom:0}
.nw-p2-checkrow:hover .nw-p2-checkrow-label{color:var(--nw-text-1)}
.nw-p2-dot{width:6px;height:6px;border-radius:50%;flex:0 0 6px;margin-top:5px;background:var(--nw-border-strong)}
.nw-p2-dot.is-done{background:var(--nw-success)}
.nw-p2-dot.is-warn,.nw-p2-dot.is-plan{background:var(--nw-warn)}
.nw-p2-dot.is-info{background:var(--nw-text-3)}
.nw-p2-dot.is-idle{background:var(--nw-border-strong)}
.nw-p2-checkrow-label{flex:0 1 auto;min-width:0;max-width:46%;font-size:11.5px;color:var(--nw-text-2);line-height:1.55;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nw-p2-checkrow-detail{flex:1 1 auto;min-width:0;font-size:11.5px;color:var(--nw-text-1);line-height:1.55;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;text-align:right}
.nw-p2-checkrow.is-done .nw-p2-checkrow-detail{color:var(--nw-text-2)}
.nw-p2-checkrow.is-content .nw-p2-checkrow-label{flex:0 0 78px;max-width:78px;white-space:normal;line-height:1.45;font-weight:500;color:var(--nw-text-2)}
.nw-p2-checkrow.is-content .nw-p2-checkrow-detail{text-align:left;color:var(--nw-text-2)}
.nw-p2-hint{font-size:11px;line-height:1.65;color:var(--nw-text-2);margin:8px 0 0}
.nw-p2-hint.is-good{color:var(--nw-success)}
.nw-p2-note{font-size:10.5px;line-height:1.6;color:var(--nw-text-3);margin:6px 0 0}
.nw-p2-quote{font-family:var(--nw-serif);font-size:12px;line-height:1.75;color:var(--nw-text-1);margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.nw-p2-synopsis{font-family:var(--nw-serif);font-size:12.5px;line-height:1.8;color:var(--nw-text-1);margin:0;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.nw-p2-synopsis.is-empty{color:var(--nw-text-3)}
.nw-p2-facts{display:flex;flex-wrap:wrap;gap:4px 11px;margin-top:8px;font-size:10px;color:var(--nw-text-2);font-variant-numeric:tabular-nums}
.nw-p2-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px}
.nw-p2-meta-tag{display:inline-flex;align-items:center;height:18px;padding:0 6px;border-radius:5px;background:var(--nw-hover);font-size:9px;color:var(--nw-text-3);white-space:nowrap}
.nw-p2-focus{display:block;width:100%;text-align:left;padding:10px 11px;border-radius:10px;border:1px solid var(--nw-border);background:linear-gradient(180deg,var(--nw-surface),var(--nw-hover));min-width:0}
.nw-p2-focus:hover{background:var(--nw-active)}
.nw-p2-memo{margin-top:9px;padding:9px 10px;border-radius:9px;background:var(--nw-hover)}
.nw-p2-memo-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:9.5px;color:var(--nw-text-3);margin-bottom:4px}
.nw-p2-memo p{font-family:var(--nw-serif);font-size:11.5px;line-height:1.7;color:var(--nw-text-2);margin:0;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.nw-p2-inline-link{font-size:10px;color:var(--nw-text-2);border-bottom:1px solid var(--nw-border-strong);padding-bottom:1px;margin-top:6px}
.nw-p2-inline-link:hover{color:var(--nw-text-1)}
.nw-p2-chrow{display:flex;align-items:center;gap:7px;width:100%;text-align:left;padding:5px 4px;border-radius:6px;border-bottom:1px solid var(--nw-border);min-width:0}
.nw-p2-chrow:last-child{border-bottom:0}
.nw-p2-chrow:hover{background:var(--nw-hover)}
.nw-p2-chrow.is-active{background:var(--nw-active)}
.nw-p2-chrow .nw-p2-dot{margin:0}
.nw-p2-firstchapter{margin-top:9px;padding:9px 10px;border-radius:9px;border:1px solid var(--nw-border)}
.nw-p2-inline-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.nw-p2-empty-inline{font-size:10.5px;color:var(--nw-text-3);line-height:1.6}

/* sticky prompt row */
.nw-p2-foot{flex:0 0 auto;border-top:1px solid var(--nw-border);overflow-x:auto;background:var(--nw-surface);scrollbar-width:none}
.nw-p2-foot-inner{display:flex;align-items:center;gap:5px;padding:8px 12px;width:100%;max-width:1086px;margin:0 auto}
.nw-p2-foot::-webkit-scrollbar{display:none}
.nw-p2-notice{position:absolute;left:12px;right:12px;bottom:44px;z-index:8;padding:7px 10px;border-radius:8px;background:var(--nw-text-1);color:var(--nw-primary-fg);font-size:10.5px;line-height:1.5;box-shadow:var(--nw-shadow-float)}

/* chapter reader */
.nw-p2-reader{flex:1 1 auto;min-height:0;display:flex;flex-direction:column}
.nw-p2-readerbar{flex:0 0 auto;display:flex;align-items:center;gap:5px;padding:7px 10px;border-bottom:1px solid var(--nw-border);min-width:0}
.nw-p2-readertitle{flex:1 1 auto;min-width:0;margin-left:2px}
.nw-p2-reader-no{font-size:9px;letter-spacing:.08em;color:var(--nw-text-3)}
.nw-p2-reader-name{font-family:var(--nw-serif);font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.35}
.nw-p2-readertools{display:flex;align-items:center;gap:1px;flex:0 0 auto}
.nw-p2-readerscroll{flex:1 1 auto;min-height:0;overflow:auto;padding:12px 16px 28px}
.nw-p2-readermeta{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px}
.nw-p2-readerstate{display:flex;align-items:center;gap:8px;padding:16px 0;color:var(--nw-text-3);font-size:11px}
.nw-p2-readerstate.is-error{flex-direction:column;align-items:flex-start;color:var(--nw-danger)}

/* loading, empty and errors */
.nw-p2-skeleton{padding:14px;display:flex;flex-direction:column;gap:8px}
.nw-p2-skeleton-card{height:74px;border-radius:10px;background:var(--nw-hover);animation:nw-pulse 1.4s ease-in-out infinite}
.nw-p2-skeleton-line{height:10px;border-radius:4px;background:var(--nw-hover);animation:nw-pulse 1.4s ease-in-out infinite}
.nw-p2-skeleton-line.is-wide{width:86%}
.nw-p2-skeleton-line.is-short{width:56%}
.nw-p2-empty{flex:1 1 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px;padding:28px 20px;color:var(--nw-text-3)}
.nw-p2-empty-mark{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:var(--nw-hover);color:var(--nw-text-2)}
.nw-p2-empty h2{margin:2px 0 0;font-family:var(--nw-serif);font-size:15px;font-weight:600;color:var(--nw-text-1)}
.nw-p2-empty p{margin:0;font-size:10.5px;line-height:1.65;max-width:30ch}
.nw-p2-empty.is-error .nw-p2-empty-mark{color:var(--nw-danger)}

/* the panel is often docked or dragged narrow: keep hierarchy, drop chrome */
@container nw-p2 (min-width:620px){
  .nw-p2-grid{display:grid;grid-template-columns:minmax(0,1fr) 214px;gap:18px;align-items:start}
  .nw-p2-aside{position:sticky;top:0}
  .nw-p2-only-wide{display:block}
  .nw-p2-only-narrow{display:none}
}
@container nw-p2 (max-width:360px){
  .nw-p2-head-inner{padding:10px 10px 8px;gap:8px}
  .nw-p2-cover{display:none}
  .nw-p2-title{font-size:14px}
  .nw-p2-scroll{padding:10px 10px 18px}
  .nw-p2-step:not(.is-active) .nw-p2-step-label{display:none}
  .nw-p2-step:not(:last-child)::after{width:9px;flex-basis:9px}
  .nw-p2-next{padding:11px 12px 10px}
  .nw-p2-checkrow-label{max-width:42%}
  .nw-p2-foot-inner{padding:7px 9px}
}
@container nw-p2 (max-width:300px){
  .nw-p2-meta{font-size:9px;gap:0 5px}
  .nw-p2-readerscroll{padding:10px 12px 24px}
}

/* journey: the one next step, four stages, and the health checklist */
.nw-jsteps{display:flex;align-items:center;gap:0;margin:2px 0 18px;max-width:560px}
.nw-jstep{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--nw-text-3);white-space:nowrap}
.nw-jstep-dot{width:7px;height:7px;border-radius:50%;background:var(--nw-border-strong);flex:0 0 auto}
.nw-jstep-line{width:34px;height:1px;background:var(--nw-border);margin:0 8px;flex:0 0 34px}
.nw-jstep.is-done{color:var(--nw-text-2)}
.nw-jstep.is-done .nw-jstep-dot{background:color-mix(in oklab,var(--nw-success) 55%,transparent)}
.nw-jstep.is-active{color:var(--nw-text-1);font-weight:600}
.nw-jstep.is-active .nw-jstep-dot{background:var(--nw-text-1);box-shadow:0 0 0 3px color-mix(in oklab,var(--nw-text-1) 10%,transparent)}
.nw-journey{position:relative;padding:22px 24px;border-radius:14px;background:var(--nw-surface);box-shadow:var(--nw-shadow-card);margin:4px 0 22px;overflow:hidden}
.nw-journey::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--nw-text-1);opacity:.82}
.nw-journey-kicker{font-size:10px;letter-spacing:.14em;color:var(--nw-text-3);text-transform:uppercase}
.nw-journey-title{font-family:var(--nw-serif);font-size:21px;font-weight:600;margin:7px 0 0;letter-spacing:.01em}
.nw-journey-desc{font-size:13px;color:var(--nw-text-2);margin:7px 0 0;line-height:1.75;max-width:52ch}
.nw-journey-actions{display:flex;align-items:center;gap:10px;margin-top:16px;flex-wrap:wrap}
.nw-journey-hints{display:flex;flex-direction:column;gap:4px;margin-top:14px;padding-top:12px;border-top:1px solid var(--nw-border)}
.nw-journey-hint{font-size:11.5px;color:var(--nw-text-3);line-height:1.65}
.nw-health{margin:0 0 20px;padding:12px 2px 0;border-top:1px solid var(--nw-border)}
.nw-health-head{display:flex;align-items:center;gap:8px;font-size:11px;letter-spacing:.08em;color:var(--nw-text-3);margin-bottom:7px}
.nw-health-head button{margin-left:auto;color:var(--nw-text-2);font-size:11px}
.nw-health-head button:hover{text-decoration:underline}
.nw-health-row{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:var(--nw-text-2);line-height:1.6;padding:2px 0}
.nw-health-dot{width:6px;height:6px;border-radius:50%;margin-top:6px;flex:0 0 6px;background:var(--nw-text-3)}
.nw-health-dot.is-warn{background:var(--nw-warn)}
.nw-health-dot.is-good{background:var(--nw-success)}
.nw-health-dot.is-info{background:var(--nw-text-3)}
.nw-health-note{color:var(--nw-text-3);font-size:11px;margin-left:auto;flex:0 0 auto}

/* create-book and export dialogs */
.nw-dialog.is-wide{width:min(560px,100%);max-height:min(760px,calc(100vh - 48px));overflow:auto}
.nw-form{display:grid;gap:14px;margin-top:20px}
.nw-form-row{display:grid;gap:6px;min-width:0}
.nw-form-label{font-size:12px;color:var(--nw-text-2);font-weight:500}
.nw-form-label em{font-style:normal;color:var(--nw-text-3);font-weight:400}
.nw-input,.nw-textarea,.nw-select{width:100%;background:var(--nw-canvas);border:1px solid var(--nw-border);border-radius:9px;padding:9px 11px;font:inherit;font-size:13px;color:var(--nw-text-1);outline:none;transition:border-color .15s,box-shadow .15s}
.nw-input:focus,.nw-textarea:focus,.nw-select:focus{border-color:color-mix(in oklab,var(--nw-text-2) 55%,transparent);box-shadow:0 0 0 3px color-mix(in oklab,var(--nw-text-2) 10%,transparent)}
.nw-textarea{resize:vertical;min-height:72px;line-height:1.7}
.nw-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.nw-path{display:flex;align-items:center;gap:8px;background:var(--nw-hover);border-radius:9px;padding:8px 10px;font-size:11px;color:var(--nw-text-3);word-break:break-all;line-height:1.55}
.nw-path span{flex:1 1 auto;min-width:0}
.nw-form-error{color:var(--nw-danger);font-size:12px;line-height:1.6}
.nw-form-note{font-size:11px;color:var(--nw-text-3);line-height:1.65;margin:0}
.nw-export{display:grid;gap:16px;margin-top:18px}
.nw-choice-row{display:flex;gap:6px;flex-wrap:wrap}
.nw-choice{border:1px solid var(--nw-border);border-radius:9px;padding:8px 12px;font-size:12px;color:var(--nw-text-2);background:transparent}
.nw-choice:hover{background:var(--nw-hover);color:var(--nw-text-1)}
.nw-choice.is-active{border-color:var(--nw-text-1);color:var(--nw-text-1);background:color-mix(in oklab,var(--nw-text-1) 5%,transparent);font-weight:600}
.nw-check{display:flex;flex-direction:column;gap:6px;background:var(--nw-hover);border-radius:10px;padding:12px 14px}
.nw-check-title{font-size:11px;letter-spacing:.08em;color:var(--nw-text-3);margin-bottom:2px}
.nw-check-row{display:flex;align-items:flex-start;gap:8px;font-size:12px;line-height:1.65;color:var(--nw-text-2)}
.nw-check-row b{font-weight:600;color:var(--nw-text-1)}
.nw-download{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:color-mix(in oklab,var(--nw-success) 9%,transparent);color:var(--nw-text-1);font-size:12px;line-height:1.6}
.nw-download a{color:var(--nw-text-1);font-weight:600;text-decoration:underline;text-underline-offset:2px}
.nw-export-done{display:grid;gap:10px}
.nw-export-done h3{margin:0;font-size:14px;font-weight:600}
.nw-export-done p{margin:0;font-size:12px;color:var(--nw-text-2)}
/* Top bar utilities: one quiet link style for the site entry, the author, and
   the rescan action. No pills, no permanent underline; the icon is the only
   affordance difference and the underline appears on hover. */
.nw-topbar-actions{display:flex;align-items:center;gap:24px}
.nw-topbar-actions .nw-pro-entry,
.nw-topbar-actions .nw-contact-entry,
.nw-topbar-actions .nw-rescan{display:inline-flex;align-items:center;gap:5px;height:30px;padding:0;border:0;border-radius:0;background:none;font:inherit;font-size:11px;letter-spacing:.08em;color:var(--nw-text-2);text-decoration:none;white-space:nowrap;cursor:pointer;transition:color .2s}
.nw-topbar-actions .nw-pro-entry svg,
.nw-topbar-actions .nw-contact-entry svg,
.nw-topbar-actions .nw-rescan svg{width:13px;height:13px;opacity:.7}
.nw-topbar-actions .nw-pro-entry:hover,
.nw-topbar-actions .nw-contact-entry:hover,
.nw-topbar-actions .nw-rescan:hover{color:var(--nw-text-1);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px;text-decoration-color:color-mix(in oklab,var(--nw-text-1) 40%,transparent)}

/* visible tracking: progress, summaries, foreshadowing, character states */
.nw-track{padding:28px 40px 72px;max-width:980px;margin:0 auto}
.nw-track-note{font-size:11px;color:var(--nw-text-3);line-height:1.7;margin:0 0 18px}
.nw-track-hero{padding:4px 0 18px;border-bottom:1px solid var(--nw-border)}
.nw-track-hero-num{display:flex;align-items:baseline;gap:6px}
.nw-track-hero-num b{font-family:var(--nw-serif);font-size:38px;line-height:1;font-weight:600}
.nw-track-hero-num span{font-size:13px;color:var(--nw-text-2)}
.nw-track-hero p{font-size:12px;color:var(--nw-text-2);margin:8px 0 12px}
.nw-track-section{margin-top:26px}
.nw-track-section h3{font-size:12px;letter-spacing:.08em;color:var(--nw-text-3);font-weight:600;margin:0 0 10px;text-transform:uppercase}
.nw-track-vol{display:grid;grid-template-columns:1fr auto 120px;align-items:center;gap:12px;padding:6px 0;font-size:12px;color:var(--nw-text-2)}
.nw-track-vol b{font-weight:500;color:var(--nw-text-1);font-variant-numeric:tabular-nums}
.nw-track-next{font-family:var(--nw-serif);font-size:17px;margin:0 0 6px}
.nw-track-section .nw-btn{margin-top:10px}
.nw-track-issue{display:flex;align-items:flex-start;gap:8px;padding:6px 0;font-size:12.5px;color:var(--nw-text-2);line-height:1.6}
.nw-track-issue em{font-style:normal;color:var(--nw-text-3);display:block;font-size:11px;margin-top:2px}
.nw-track-table-wrap{overflow:auto;border:1px solid var(--nw-border);border-radius:10px}
.nw-track-table{width:100%;border-collapse:collapse;font-size:12px;min-width:760px}
.nw-track-table th{text-align:left;font-weight:500;color:var(--nw-text-3);font-size:11px;letter-spacing:.04em;padding:9px 10px;border-bottom:1px solid var(--nw-border);background:var(--nw-hover)}
.nw-track-table td{padding:9px 10px;border-bottom:1px solid var(--nw-border);color:var(--nw-text-2);vertical-align:top;line-height:1.6}
.nw-track-table tr:last-child td{border-bottom:0}
.nw-track-mono{font-family:var(--nw-mono);font-size:10.5px;color:var(--nw-text-3);white-space:nowrap}
.nw-track-sum{padding:14px 0;border-bottom:1px solid var(--nw-border)}
.nw-track-sum:last-child{border-bottom:0}
.nw-track-sum-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.nw-track-sum-head b{font-family:var(--nw-serif);font-size:15px;font-weight:600}
.nw-track-sum-title{font-size:13px;color:var(--nw-text-2);flex:1 1 auto;min-width:0}
.nw-track-sum-head em{font-style:normal;font-size:11px;color:var(--nw-text-3);font-variant-numeric:tabular-nums}
.nw-track-sum-body{font-family:var(--nw-serif);font-size:13.5px;line-height:1.85;color:var(--nw-text-1);margin:7px 0 0;white-space:pre-wrap}
.nw-track-events{margin:8px 0 0;padding-left:18px;font-size:12px;line-height:1.7;color:var(--nw-text-2)}
.nw-track-people{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.nw-track-person{padding:14px 16px;border-radius:10px;background:var(--nw-surface);border:1px solid var(--nw-border);text-align:left;min-width:0}
.nw-track-person.is-link:hover{background:var(--nw-hover)}
.nw-track-person-head{display:flex;align-items:center;gap:8px}
.nw-track-person-head b{font-family:var(--nw-serif);font-size:15px}
.nw-track-states{display:flex;flex-wrap:wrap;gap:5px 12px;margin-top:9px}
.nw-track-state{font-size:11.5px;color:var(--nw-text-2);line-height:1.6}
.nw-track-state em{font-style:normal;color:var(--nw-text-3);margin-right:4px}
.nw-track-recent{margin-top:10px;padding-top:8px;border-top:1px solid var(--nw-border);font-size:11px}
.nw-track-change{color:var(--nw-text-2);line-height:1.6;margin-top:2px}
@media (max-width:900px){.nw-track{padding:22px 20px 56px}.nw-track-people{grid-template-columns:1fr}.nw-track-vol{grid-template-columns:1fr auto 80px}}

.nw-track-recent-row{display:flex;align-items:center;gap:12px;padding:7px 0;border-bottom:1px solid var(--nw-border);font-size:12px}
.nw-track-recent-row:last-child{border-bottom:0}
.nw-track-recent-title{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--nw-text-1)}

@media (prefers-reduced-motion:reduce){
  .nw-root *, .nw-root *::before, .nw-root *::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}
  /* An indeterminate bar is meaningless when motion is gone: show a calm
     static fill and keep the writing page readable. */
  .nw-writing-bar i{animation:none !important;transform:none !important;width:100% !important;opacity:.35 !important}
  .nw-skel::after{animation:none !important;top:40% !important;opacity:.35 !important}
  .nw-writing-dots i{animation:none !important;opacity:.55 !important}
}

/* fullscreen or a deliberately wide sidebar: center the board instead of
   stretching a two-column mobile layout across the whole window */
@container nw-p2 (min-width:900px){
  .nw-p2-grid{max-width:1060px;margin:0 auto;grid-template-columns:minmax(0,1fr) 280px;gap:28px}
  .nw-p2-head-inner,.nw-p2-foot-inner{max-width:1086px}
}
@container nw-p2 (min-width:1200px){
  .nw-p2-grid{max-width:1140px;grid-template-columns:minmax(0,1fr) 300px;gap:32px}
  .nw-p2-head-inner,.nw-p2-foot-inner{max-width:1166px}
}

/* the side panel reuses the workbench's own blocks, only denser */
.nw-p2 .nw-section{margin-top:0}
.nw-p2 .nw-sec-head{margin-bottom:7px;flex-wrap:nowrap}
.nw-p2 .nw-sec-head h2{font-size:14px;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nw-p2 .nw-sec-head .nw-btn{flex:0 0 auto}
.nw-p2 .nw-journey{margin:0;padding:18px 20px 16px;border-radius:14px}
.nw-p2 .nw-journey-title{font-size:20px}
.nw-p2 .nw-journey-desc{font-size:12.5px;line-height:1.7;margin-top:5px}
.nw-p2 .nw-journey-actions{margin-top:12px}
.nw-p2 .nw-journey-hints{margin-top:10px;padding-top:10px}
.nw-p2 .nw-journey-hint{display:flex;align-items:center;gap:5px;font-size:11px}
.nw-p2 .nw-journey-hint.is-waiting{color:var(--nw-warn)}
.nw-p2 .nw-p2-steps{margin:2px 0 0;max-width:none}
.nw-p2 .nw-p2-step{font-size:10px;gap:5px}
.nw-p2 .nw-p2-step::after{display:none}
.nw-p2 .nw-p2-step .nw-jstep-line{width:10px;flex:0 0 10px;margin:0 4px}
.nw-p2 .nw-p2-stats{margin:0;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}
.nw-p2 .nw-p2-stats .nw-bigstat{padding:9px 10px 8px;border-radius:9px;text-align:left}
.nw-p2 .nw-bigstat b{font-size:19px}
.nw-p2 .nw-bigstat span{margin-top:4px;font-size:10px}
.nw-p2 .nw-p2-checkrow{width:100%;text-align:left;padding:5px 0;border-bottom:1px solid var(--nw-border);gap:7px}
.nw-p2 .nw-p2-checkrow:last-child{border-bottom:0}
.nw-p2 .nw-p2-checkrow .nw-p2-checkrow-label{font-size:11.5px;font-weight:500;color:var(--nw-text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nw-p2 .nw-p2-checkrow .nw-p2-checkrow-detail{flex:1 1 auto;min-width:0;font-size:11.5px;color:var(--nw-text-1);line-height:1.55;text-align:right;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.nw-p2 .nw-p2-checkrow.is-content .nw-p2-checkrow-label{flex:0 0 78px;max-width:78px;white-space:normal;font-weight:500}
.nw-p2 .nw-p2-checkrow.is-content .nw-p2-checkrow-detail{text-align:left;color:var(--nw-text-2)}
.nw-p2 .nw-p2-checkrow .nw-dot{margin-top:4px}
.nw-p2 .nw-p2-chrow{height:33px;padding:0 2px;gap:8px;border-bottom:1px solid var(--nw-border);border-radius:0}
.nw-p2 .nw-p2-chrow:last-child{border-bottom:0}
.nw-p2 .nw-p2-chrow.is-active{background:var(--nw-active)}
.nw-p2 .nw-p2-chrow .nw-rrow-no{width:auto;flex:0 0 auto;font-size:9.5px}
.nw-p2 .nw-p2-chrow .nw-rrow-title{font-size:12px}
.nw-p2 .nw-p2-chrow .nw-rrow-words{font-size:9.5px}
.nw-p2 .nw-p2-chrow .nw-dot{margin:0}
.nw-p2 .nw-p2-foot{display:block;padding:0;border-top:1px solid var(--nw-border);overflow-x:auto;background:var(--nw-surface)}
.nw-p2 .nw-p2-foot-inner{display:flex;align-items:center;gap:6px;padding:8px 12px;width:100%;margin:0 auto}
.nw-p2 .nw-tag{max-width:100%;overflow:hidden;text-overflow:ellipsis}
.nw-p2 .nw-tag.is-link:hover{background:var(--nw-active);color:var(--nw-text-1)}
.nw-p2 .nw-p2-meta-tag{height:18px;padding:0 5px;font-size:9.5px}
.nw-p2 .nw-kv{font-size:11.5px;line-height:1.7;gap:8px}
.nw-p2 .nw-kv dt{width:72px;flex:0 0 72px}
.nw-p2 .nw-kv dd{color:var(--nw-text-2)}


.nw-p2 .nw-p2-reading{padding:0;max-width:760px;margin:0 auto;font-size:14px;line-height:1.9}
.nw-p2 .nw-p2-reading .nw-reading-title{font-size:18px;line-height:1.4;margin:0 0 12px}
.nw-p2 .nw-p2-reading .nw-reading-kicker{font-size:10px;margin-bottom:8px}
.nw-p2 .nw-p2-reading .nw-reading-list{font-size:13px;line-height:1.8;margin-top:6px}
.nw-p2 .nw-p2-reading .nw-field{padding:7px 0}
.nw-p2 .nw-p2-reading .nw-field-label{font-size:10px;margin-bottom:2px}
.nw-p2 .nw-p2-reading .nw-field-value{font-size:13.5px;line-height:1.8}
.nw-p2 .nw-p2-firstchapter{margin-top:9px;padding:10px 12px;border:1px solid var(--nw-border);border-radius:9px}
.nw-p2 .nw-p2-focus{display:block;width:100%;text-align:left;padding:10px 12px;border-radius:10px;background:var(--nw-hover);border:0}
.nw-p2 .nw-p2-focus:hover{background:var(--nw-active)}
.nw-p2 .nw-p2-focus .nw-reading-title{font-size:15px;margin:0 0 8px}
.nw-p2 .nw-p2-focus .nw-reading-kicker{margin-bottom:3px}
.nw-p2 .nw-p2-memo{margin-top:9px}
.nw-p2 .nw-p2-memo .nw-check-title{display:flex;align-items:center;justify-content:space-between;gap:8px}
.nw-p2 .nw-p2-memo .nw-track-sum-body{margin-top:4px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.nw-p2 .nw-p2-memo .nw-btn{align-self:flex-start;margin-top:2px;padding:0 8px}
.nw-dot.is-warn{background:var(--nw-warn)}
.nw-dot.is-info{background:var(--nw-text-3)}
.nw-p2 .nw-check-row.is-static{cursor:default}

.nw-p2 .nw-p2-meta{margin-top:0}
.nw-p2 .nw-outline-volume{padding:8px 0}
.nw-p2 .nw-outline-volume h3{font-size:13px;margin-bottom:3px}
.nw-p2 .nw-outline-volume p{margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
`

// ---- 40-icons.js ----
    /** Inline line icons. 24 viewBox, 1.7 stroke, currentColor. */
    const ICONS = {
      book: [['path', { d: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15.5H6.5A2.5 2.5 0 0 0 4 21z' }], ['path', { d: 'M4 18.5A2.5 2.5 0 0 1 6.5 16H19' }], ['path', { d: 'M8 7h7' }], ['path', { d: 'M8 10.5h5' }]],
      home: [['path', { d: 'M4 10.5 12 4l8 6.5' }], ['path', { d: 'M6.5 9v10.5h11V9' }], ['path', { d: 'M10.5 19.5v-5h3v5' }]],
      panelLeft: [['rect', { x: 3, y: 4, width: 18, height: 16, rx: 2.5 }], ['path', { d: 'M9 4v16' }]],
      panelRight: [['rect', { x: 3, y: 4, width: 18, height: 16, rx: 2.5 }], ['path', { d: 'M15 4v16' }]],
      plus: [['path', { d: 'M12 5v14M5 12h14' }]],
      more: [['circle', { cx: 5.5, cy: 12, r: 1 }], ['circle', { cx: 12, cy: 12, r: 1 }], ['circle', { cx: 18.5, cy: 12, r: 1 }]],
      search: [['circle', { cx: 10.5, cy: 10.5, r: 6 }], ['path', { d: 'm15 15 4 4' }]],
      refresh: [['path', { d: 'M20 11a8 8 0 1 0-2.3 6' }], ['path', { d: 'M20 5v6h-6' }]],
      edit: [['path', { d: 'M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z' }], ['path', { d: 'm14.5 6.5 3 3' }]],
      chevronDown: [['path', { d: 'm6 9 6 6 6-6' }]],
      chevronRight: [['path', { d: 'm9 6 6 6-6 6' }]],
      chevronLeft: [['path', { d: 'm15 6-6 6 6 6' }]],
      arrowRight: [['path', { d: 'M4 12h15' }], ['path', { d: 'm13 6 6 6-6 6' }]],
      grid: [['rect', { x: 3.5, y: 3.5, width: 7, height: 7, rx: 1.5 }], ['rect', { x: 13.5, y: 3.5, width: 7, height: 7, rx: 1.5 }], ['rect', { x: 3.5, y: 13.5, width: 7, height: 7, rx: 1.5 }], ['rect', { x: 13.5, y: 13.5, width: 7, height: 7, rx: 1.5 }]],
      file: [['path', { d: 'M6 3h7l5 5v13H6z' }], ['path', { d: 'M13 3v5h5' }], ['path', { d: 'M9 13h6M9 17h4' }]],
      compass: [['circle', { cx: 12, cy: 12, r: 8.5 }], ['path', { d: 'm15.5 8.5-2 5-5 2 2-5z' }]],
      users: [['circle', { cx: 9, cy: 8, r: 3 }], ['path', { d: 'M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5' }], ['path', { d: 'M16 5.5a3 3 0 0 1 0 5.5' }], ['path', { d: 'M17.5 15.5c2 .7 3 2.4 3 4.5' }]],
      archive: [['rect', { x: 3.5, y: 4.5, width: 17, height: 5, rx: 1.5 }], ['path', { d: 'M5 9.5v9a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-9' }], ['path', { d: 'M10 13h4' }]],
      close: [['path', { d: 'm6 6 12 12M18 6 6 18' }]],
      check: [['path', { d: 'm5 12.5 4.5 4.5L19 7' }]],
      alert: [['path', { d: 'M12 4 3.5 20h17z' }], ['path', { d: 'M12 9.5v4.5' }], ['path', { d: 'M12 17.5v.01' }]],
      spark: [['path', { d: 'M12 3.5 13.8 9l5.5 1.8-5.5 1.8L12 18l-1.8-5.4L4.7 10.8 10.2 9z' }]],
      save: [['path', { d: 'M5 4h11l3 3v13H5z' }], ['path', { d: 'M8 4v5h7V4' }], ['path', { d: 'M8 14h8v6H8z' }]],
      clock: [['circle', { cx: 12, cy: 12, r: 8.5 }], ['path', { d: 'M12 7.5V12l3 2' }]],
      external: [['path', { d: 'M14 4h6v6' }], ['path', { d: 'M20 4 11 13' }], ['path', { d: 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5' }]],
    }

    /**
     * One inline icon.
     * @param {string} name - glyph name.
     * @param {number} [size] - pixel size.
     * @returns {any} the svg element.
     */
    function icon(name, size = 16) {
      const parts = ICONS[name] ?? []
      return e('svg', {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
      }, parts.map(([tag, attrs], index) => e(tag, { ...attrs, key: index })))
    }

    /**
     * An icon-only button.
     *
     * The visible name lives in a CSS tooltip (`data-tip`, drawn by
     * `[data-tip]::after`), so it appears instantly on hover and on keyboard
     * focus. Native `title` is deliberately not set: it would wait a second and
     * then draw a second, uglier tooltip on top of this one. `aria-label` keeps
     * the button named for screen readers and tests.
     *
     * @param {object} props - glyph, label, onClick and optional tooltip alignment.
     * @returns {any} the button.
     */
    function IconButton(props) {
      const {
        glyph, label, onClick, disabled, className = '', size = 16,
        ariaExpanded, ariaPressed, tipAlign, tipPlace, plain, autoFocus,
      } = props
      return e('button', {
        type: 'button',
        className: `${plain ? '' : 'nw-iconbtn'} ${className}`.trim(),
        'aria-label': label,
        'aria-expanded': ariaExpanded,
        'aria-pressed': ariaPressed,
        disabled,
        autoFocus,
        onClick,
        'data-tip': label,
        'data-tip-align': tipAlign,
        'data-tip-place': tipPlace,
      }, icon(glyph, size))
    }

// ---- 50-shelf.js ----
    /**
     * Stable hash for a book's generated cover.
     * @param {string} value - book title + folder.
     * @returns {number} unsigned 32-bit hash.
     */
    function hashString(value) {
      let hash = 2166136261
      for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index)
        hash = Math.imul(hash, 16777619)
      }
      return hash >>> 0
    }

    /**
     * Pick a deterministic cover treatment for one book.
     * @param {object} book - scanned book row.
     * @returns {{ bg: string, ink: string, accent: string, pattern: string, vertical: boolean, seal: string }} cover spec.
     */
    function coverSpec(book) {
      const seed = hashString(`${book?.title ?? ''}|${book?.relDir ?? ''}`)
      const palette = COVER_PALETTES[seed % COVER_PALETTES.length]
      const title = String(book?.title ?? '书')
      return {
        ...palette,
        vertical: ((seed >> 7) & 1) === 0,
        seal: Array.from(title)[0] ?? '书',
        seed,
      }
    }

    /**
     * Deterministic rain lines for a cover.
     * @param {number} seed - cover hash.
     * @returns {any[]} line elements.
     */
    function rainLines(seed) {
      const lines = []
      for (let index = 0; index < 22; index += 1) {
        const left = (index * 4.7 + (seed % 17)) % 96
        const top = (index * 7.3) % 22 - 8
        const height = 22 + ((index * 13 + seed) % 52)
        const opacity = 0.14 + ((index * 7) % 26) / 100
        lines.push(e('i', {
          key: index,
          style: { left: `${left.toFixed(1)}%`, top: `${top.toFixed(1)}%`, height: `${height}%`, opacity: opacity.toFixed(2) },
        }))
      }
      return lines
    }

    /**
     * Generated book cover. Reused by the shelf, overview, and panel.
     * @param {{ book: object, spec?: object, className?: string }} props - book + optional spec.
     * @returns {any} the cover element.
     */
    function CoverArt(props) {
      const book = props.book
      const spec = props.spec ?? coverSpec(book)
      const art = spec.pattern === 'rain'
        ? e('div', { className: 'nw-rain' }, rainLines(spec.seed ?? coverSpec(book).seed))
        : spec.pattern === 'sun'
          ? [
            e('span', { className: 'nw-sun', key: 'sun' }),
            e('span', { className: 'nw-horizon', key: 'horizon' }),
          ]
          : [
            e('span', { className: 'nw-ring', key: 'ring' }),
            e('span', { className: 'nw-ring is-small', key: 'ring-small' }),
            e('svg', { className: 'nw-bird', viewBox: '0 0 60 30', 'aria-hidden': true, key: 'bird' }, e('path', { d: 'M2 24C12 12 20 9 29 16c7 5 14 6 29-4' })),
          ]
      return e('div', {
        className: `nw-cover ${props.className ?? ''}`,
        style: { '--cbg': spec.bg, '--cink': spec.ink, '--caccent': spec.accent },
      },
        e('div', { className: 'nw-cover-art' }, art),
        e('span', { className: 'nw-cover-mark' }, 'NARRA'),
        e('span', { className: `nw-cover-title ${spec.vertical ? 'is-vertical' : 'is-horizontal'}` }, book?.title ?? ''),
        e('span', { className: 'nw-cover-seal' }, spec.seal ?? '书'),
        e('div', { className: 'nw-cover-sheen' }),
        e('div', { className: 'nw-cover-grain' }),
        e('div', { className: 'nw-cover-spine' }),
        e('div', { className: 'nw-cover-edge' }),
      )
    }

    /**
     * Pointer tilt for the featured cover. Writes CSS variables directly so the
     * page does not re-render on every pointer move.
     * @param {any} galleryRef - gallery element ref.
     * @param {any} heroRef - featured card ref.
     * @param {boolean} enabled - skip when reduced motion or no book.
     */
    function useShelfTilt(galleryRef, heroRef, enabled) {
      useEffect(() => {
        const gallery = galleryRef.current
        if (!gallery || !enabled) return undefined
        if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
        const onMove = (event) => {
          const hero = heroRef.current
          if (!hero) return
          const rect = gallery.getBoundingClientRect()
          if (rect.width === 0 || rect.height === 0) return
          const x = (event.clientX - rect.left) / rect.width - 0.5
          hero.style.setProperty('--tilt', `${(x * 3.6).toFixed(2)}deg`)
        }
        const onLeave = () => {
          const hero = heroRef.current
          if (!hero) return
          hero.style.setProperty('--tilt', '0deg')
        }
        gallery.addEventListener('pointermove', onMove)
        gallery.addEventListener('pointerleave', onLeave)
        return () => {
          gallery.removeEventListener('pointermove', onMove)
          gallery.removeEventListener('pointerleave', onLeave)
        }
      }, [galleryRef, heroRef, enabled])
    }

    /**
     * The create-book dialog: a title, an optional sentence, a plan, and where
     * the folder goes. It creates the book and hands it back to the page.
     * @param {object} props - form state and callbacks.
     * @returns {any} the modal.
     */
    function CreateBookDialog(props) {
      const { t, form, setForm, creating, error, location } = props
      const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
      useEffect(() => {
        const onKey = (event) => { if (event.key === 'Escape' && !creating) props.onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [creating, props.onClose])
      return e('div', {
        className: 'nw-layer',
        onClick: (event) => { if (event.target === event.currentTarget && !creating) props.onClose() },
      },
        e('div', { className: 'nw-dialog is-wide', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('create.title') },
          e('h2', { className: 'nw-dialog-title' }, t('create.title')),
          e('p', { className: 'nw-dialog-body' }, t('create.lead')),
          e('div', { className: 'nw-form' },
            e('label', { className: 'nw-form-row' },
              e('span', { className: 'nw-form-label' }, t('create.name')),
              e('input', {
                className: 'nw-input', value: form.title, placeholder: t('create.nameHint'),
                autoFocus: true, onChange: set('title'),
              }),
            ),
            e('div', { className: 'nw-form-grid' },
              e('label', { className: 'nw-form-row' },
                e('span', { className: 'nw-form-label' }, t('create.genre')),
                e('input', { className: 'nw-input', value: form.genre, placeholder: t('create.genreHint'), onChange: set('genre') }),
              ),
              e('label', { className: 'nw-form-row' },
                e('span', { className: 'nw-form-label' }, t('create.words')),
                e('select', { className: 'nw-select', value: String(form.words), onChange: set('words') },
                  [1500, 2000, 3000, 4000, 5000].map((value) => e('option', { key: value, value: String(value) }, `${value.toLocaleString()} 字`)),
                ),
              ),
            ),
            e('label', { className: 'nw-form-row' },
              e('span', { className: 'nw-form-label' }, t('create.chapters')),
              e('input', { className: 'nw-input', type: 'number', min: 1, max: 2000, value: form.chapters, onChange: set('chapters') }),
            ),
            e('label', { className: 'nw-form-row' },
              e('span', { className: 'nw-form-label' }, `${t('create.idea')} · ${t('create.optional')}`),
              e('textarea', { className: 'nw-textarea', value: form.idea, placeholder: t('create.ideaHint'), onChange: set('idea') }),
            ),
            e('div', { className: 'nw-form-row' },
              e('span', { className: 'nw-form-label' }, t('create.location')),
              e('div', { className: 'nw-path' },
                e('span', null, location || t('create.defaultLocation')),
                props.onChangeLocation
                  ? e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', onClick: props.onChangeLocation }, t('create.changeLocation'))
                  : null,
              ),
            ),
            error ? e('div', { className: 'nw-form-error' }, error) : null,
            e('p', { className: 'nw-form-note' }, t('create.hint')),
          ),
          e('div', { className: 'nw-dialog-actions' },
            e('button', { type: 'button', className: 'nw-btn is-secondary', disabled: creating, onClick: props.onClose }, t('create.cancel')),
            e('button', { type: 'button', className: 'nw-btn is-primary', disabled: creating, onClick: props.onSubmit }, creating ? t('create.creating') : t('create.submit')),
          ),
        ),
      )
    }

    /**
     * Contact-author popup: a short bio, the open-source GitHub link and the
     * two QR codes from the NarraCat website. Kept as one small dialog on the
     * shelf so it is one click away without becoming a permanent banner.
     * @param {{ t: Function, onClose: Function }} props - copy and close.
     * @returns {any} the modal.
     */
    function ContactAuthorDialog(props) {
      const { t, onClose } = props
      useEffect(() => {
        const onKey = (event) => { if (event.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [onClose])
      const card = (src, alt, label) => e('figure', { className: 'nw-qr-card' },
        e('img', { className: 'nw-qr-img', src, alt }),
        e('figcaption', null,
          e('b', null, label),
          e('span', null, t('contact.scan')),
        ),
      )
      return e('div', {
        className: 'nw-layer',
        onClick: (event) => { if (event.target === event.currentTarget) onClose() },
      },
        e('div', {
          className: 'nw-dialog nw-contact-dialog',
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': t('contact.title'),
        },
          e(IconButton, {
            glyph: 'close',
            label: t('contact.close'),
            className: 'nw-contact-close',
            plain: true,
            tipAlign: 'end',
            autoFocus: true,
            onClick: onClose,
          }),
          e('div', { className: 'nw-contact-head' },
            e('img', { className: 'nw-contact-avatar', src: AUTHOR_AVATAR, alt: t('contact.avatarAlt') }),
            e('div', null,
              e('h2', { className: 'nw-contact-name' }, 'Yannik'),
              e('span', { className: 'nw-contact-role' }, t('contact.role')),
            ),
          ),
          e('p', { className: 'nw-contact-bio' }, t('contact.bio')),
          e('a', {
            className: 'nw-contact-github',
            href: AUTHOR_GITHUB,
            target: '_blank',
            rel: 'noopener noreferrer',
          }, icon('external', 14), t('contact.github')),
          e('section', { className: 'nw-pro-card' },
            e('div', { className: 'nw-pro-copy' },
              e('h3', { className: 'nw-pro-title' }, t('contact.proTitle')),
              e('p', { className: 'nw-pro-body' }, t('contact.proBody')),
              e('p', { className: 'nw-pro-note' }, t('contact.proReq')),
            ),
            e('div', { className: 'nw-pro-actions' },
              e('a', { className: 'nw-pro-primary', href: NARRACAT_DOWNLOAD_MAC, target: '_blank', rel: 'noopener noreferrer' }, t('contact.downloadMac')),
              e('a', { className: 'nw-pro-primary', href: NARRACAT_DOWNLOAD_WIN, target: '_blank', rel: 'noopener noreferrer' }, t('contact.downloadWin')),
              e('a', { className: 'nw-pro-site', href: NARRACAT_SITE, target: '_blank', rel: 'noopener noreferrer' }, icon('external', 13), t('contact.visitSite')),
            ),
          ),
          e('div', { className: 'nw-contact-hint' }, t('contact.hint')),
          e('div', { className: 'nw-contact-qrs' },
            card(AUTHOR_QR_XHS, t('contact.qrAltXhs'), t('contact.xhs')),
            card(AUTHOR_QR_WECHAT, t('contact.qrAltWechat'), t('contact.wechat')),
          ),
          e('p', { className: 'nw-contact-foot' }, t('contact.foot')),
        ),
      )
    }

    /**
     * Shelf poster: one featured cover, a fan of side covers, and an index.
     * @param {object} props - t, books, selected, snapshot, callbacks, state.
     * @returns {any} the shelf page.
     */
    function ShelfPage(props) {
      const t = props.t
      const rootClass = `nw-root${props.titlebarInset ? ' is-mac-titlebar' : ''}`
      const rootProps = { className: rootClass, ref: props.rootRef }
      const books = Array.isArray(props.books) ? props.books : []
      const n = books.length
      const index = n === 0 ? 0 : Math.max(0, Math.min(n - 1, props.selected))
      const book = books[index] ?? null
      const spec = book ? coverSpec(book) : null
      const snapshot = props.snapshot ?? null
      const galleryRef = useRef(null)
      const heroRef = useRef(null)
      const activeIndexRef = useRef(null)
      useShelfTilt(galleryRef, heroRef, Boolean(book) && !props.loading && !props.error)

      useEffect(() => {
        const row = activeIndexRef.current
        if (row && typeof row.scrollIntoView === 'function') row.scrollIntoView({ block: 'nearest' })
      }, [index, n])

      const [createOpen, setCreateOpen] = useState(false)
      const [createForm, setCreateForm] = useState({ title: '', genre: '', idea: '', chapters: 20, words: 3000, parent: '' })
      const [creating, setCreating] = useState(false)
      const [createError, setCreateError] = useState('')
      const [contactOpen, setContactOpen] = useState(false)
      const location = createForm.parent || props.libraryDir || ''
      const openCreate = () => {
        setCreateError('')
        setCreateForm((current) => ({ ...current, parent: current.parent || props.libraryDir || '' }))
        setCreateOpen(true)
      }
      const closeCreate = () => { if (!creating) setCreateOpen(false) }
      const submitCreate = async () => {
        if (!createForm.title.trim()) { setCreateError(t('create.required')); return }
        setCreating(true)
        setCreateError('')
        try {
          const created = await apiPost('create-book', {
            title: createForm.title.trim(),
            genre: createForm.genre.trim(),
            idea: createForm.idea.trim(),
            plannedChapters: Math.max(1, Math.min(2000, Number(createForm.chapters) || 20)),
            wordsPerChapter: Math.max(300, Math.min(20000, Number(createForm.words) || 3000)),
            parentDir: createForm.parent || undefined,
          })
          setCreateOpen(false)
          // The book exists now; refreshing the shelf and opening it continue in
          // the background, so the dialog never lingers behind a warning.
          try {
            await props.onCreated(created)
          } catch (error) {
            console.warn('novel: opening the created book failed', error)
          }
        } catch (error) {
          setCreateError(error instanceof Error ? error.message : String(error))
        } finally {
          setCreating(false)
        }
      }
      const pickLocation = async () => {
        const picked = await props.pickDirectory?.()
        if (picked) setCreateForm((current) => ({ ...current, parent: picked }))
      }
      const contactDialog = contactOpen ? e(ContactAuthorDialog, { t, onClose: () => setContactOpen(false) }) : null
      const dialog = createOpen
        ? e(CreateBookDialog, {
          t,
          form: createForm,
          setForm: setCreateForm,
          creating,
          error: createError,
          location,
          onChangeLocation: props.pickDirectory ? pickLocation : null,
          onSubmit: submitCreate,
          onClose: closeCreate,
        })
        : null

      useEffect(() => {
        // A dialog owns the keyboard while it is open; otherwise Enter on its
        // buttons would also trigger the shelf's open-book shortcut and unmount
        // the dialog with its form.
        if (!book || props.loading || props.error || createOpen || contactOpen) return undefined
        const onKey = (event) => {
          const target = event.target
          if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
          if (event.metaKey || event.ctrlKey || event.altKey) return
          if (event.key === 'ArrowLeft') { event.preventDefault(); props.onSelect((index - 1 + n) % n) }
          else if (event.key === 'ArrowRight') { event.preventDefault(); props.onSelect((index + 1) % n) }
          else if (event.key === 'Enter' && !event.metaKey && !event.ctrlKey) { event.preventDefault(); props.onOpen() }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [book, index, n, props.loading, props.error, props.onSelect, props.onOpen, createOpen, contactOpen])

      const lastWheel = useRef(0)
      const onWheel = (event) => {
        if (!book) return
        if (Math.abs(event.deltaY) < 16 && Math.abs(event.deltaX) < 16) return
        const now = Date.now()
        if (now - lastWheel.current < 480) return
        lastWheel.current = now
        const forward = (event.deltaX || event.deltaY) > 0
        props.onSelect((index + (forward ? 1 : -1) + n) % n)
      }

      const written = book?.writtenChapters ?? 0
      const total = book?.totalChapters ?? 0
      const status = !book || written === 0
        ? t('shelf.status.empty')
        : total > 0 && written >= total
          ? t('shelf.status.done')
          : t('shelf.status.writing')
      const synopsis = snapshot?.outline?.synopsis
        || snapshot?.premise?.cards?.find((card) => card?.card === 'core_hook')?.fields?.[0]?.value
        || t('shelf.noSynopsis')
      const words = snapshot?.status?.totalWords
      const next = snapshot?.status?.nextChapter
      const journeyAction = snapshot?.journey?.action ?? null
      const cta = journeyAction?.kind === 'write' && next
        ? fill(t('shelf.continue'), { no: next })
        : journeyAction?.label ?? t('shelf.open')
      const left = n > 1 ? (index - 1 + n) % n : null
      const right = n > 2 ? (index + 1) % n : null
      const number = String(index + 1).padStart(2, '0')
      const accent = spec?.accent ?? '#9a958d'

      const bar = e('header', { className: 'nw-topbar' },
        e('div', { className: 'nw-brand' },
          e('img', { className: 'nw-logo', src: NARRACAT_LOGO, alt: 'NarraCat' }),
          e('span', { className: 'nw-brand-name' }, t('brand.name')),
          e('span', { className: 'nw-brand-dot' }),
        ),
        e('div', { className: 'nw-spacer' }),
        e('div', { className: 'nw-topbar-actions' },
          e('a', { className: 'nw-pro-entry nw-hide-narrow', href: NARRACAT_SITE, target: '_blank', rel: 'noopener noreferrer' }, icon('external', 13), t('contact.proEntry')),
          e('button', { type: 'button', className: 'nw-contact-entry', onClick: () => setContactOpen(true) }, icon('users', 13), t('contact.entry')),
          e('button', { type: 'button', className: 'nw-rescan', onClick: props.onRescan }, icon('refresh', 13), t('shelf.rescan')),
        ),
      )

      if (props.loading && n === 0) {
        return e('div', rootProps, e('style', null, CSS),
          e('div', { className: 'nw-shelf', style: { '--nw-accent': accent } },
            bar,
            e('div', { className: 'nw-shelf-loading' }, e('span', { className: 'nw-spinner' }), t('shelf.loading')),
          ),
          dialog,
          contactDialog,
        )
      }
      if (props.error && n === 0) {
        return e('div', rootProps, e('style', null, CSS),
          e('div', { className: 'nw-shelf', style: { '--nw-accent': accent } },
            bar,
            e('div', { className: 'nw-shelf-empty' },
              e('div', { className: 'nw-shelf-empty-inner' },
                e('div', { className: 'nw-eyebrow' }, t('shelf.library')),
                e('h1', { className: 'nw-shelf-empty-title' }, t('shelf.error')),
                e('p', { className: 'nw-shelf-empty-body' }, String(props.error)),
                e('div', { className: 'nw-actions' }, e('button', { type: 'button', className: 'nw-cta', onClick: props.onRescan }, t('shelf.rescan'), e('span', { className: 'nw-cta-arrow' }, '→'))),
              ),
            ),
          ),
          dialog,
          contactDialog,
        )
      }
      if (n === 0) {
        return e('div', rootProps, e('style', null, CSS),
          e('div', { className: 'nw-shelf', style: { '--nw-accent': accent } },
            bar,
            e('div', { className: 'nw-shelf-empty' },
              e('div', { className: 'nw-shelf-empty-inner' },
                e('div', { className: 'nw-eyebrow' }, t('shelf.library')),
                e('h1', { className: 'nw-shelf-empty-title' }, t('shelf.empty.title')),
                e('p', { className: 'nw-shelf-empty-body' }, t('shelf.empty.body')),
                e('div', { className: 'nw-meta', style: { marginTop: 18 } }, t('shelf.empty.hint')),
                e('div', { className: 'nw-actions', style: { marginTop: 30, display: 'flex', alignItems: 'center', gap: 14 } },
                  e('button', { type: 'button', className: 'nw-cta', onClick: openCreate }, t('shelf.newBook'), e('span', { className: 'nw-cta-arrow' }, '→')),
                ),
              ),
            ),
          ),
          dialog,
          contactDialog,
        )
      }

      const side = (sideIndex, className) => {
        if (sideIndex === null) return null
        const sideBook = books[sideIndex]
        return e('button', {
          key: `side-${sideBook.key}-${className}`,
          type: 'button',
          className: `nw-card is-side ${className}`,
          onClick: () => props.onSelect(sideIndex),
          'aria-label': `${t('shelf.open')} ${sideBook.title}`,
        },
          e(CoverArt, { book: sideBook }),
          e('span', { className: 'nw-card-caption' }, sideBook.title),
        )
      }

      return e('div', rootProps, e('style', null, CSS),
        e('div', { className: 'nw-shelf', style: { '--nw-accent': accent } },
          bar,
          e('main', { className: 'nw-stage' },
            e('section', { className: 'nw-copy' },
              e('div', { className: 'nw-eyebrow' }, t('shelf.library')),
              e('h1', { key: `title-${book.key}`, className: 'nw-book-title' }, book.title),
              e('p', { key: `synopsis-${book.key}`, className: 'nw-synopsis' }, synopsis),
              e('div', { className: 'nw-meta' },
                e('span', null, book.genre || '—'),
                e('span', { className: 'nw-meta-dot' }),
                e('span', null, `${written} / ${total || '?'} 章`),
                words ? e('span', { className: 'nw-meta-dot' }) : null,
                words ? e('span', null, fill(t('workbench.words'), { n: words.toLocaleString() })) : null,
                e('span', { className: 'nw-meta-dot' }),
                e('span', null, status),
              ),
              e('div', { className: 'nw-actions' },
                e('button', { type: 'button', className: 'nw-cta', onClick: props.onOpen }, cta, e('span', { className: 'nw-cta-arrow' }, '→')),
                e('button', { type: 'button', className: 'nw-newbook', onClick: openCreate }, icon('plus', 13), t('shelf.newBook')),
              ),
            ),
            e('div', { className: 'nw-index' },
              e('div', { className: 'nw-index-head' }, e('span', null, t('shelf.index')), e('span', null, String(n).padStart(2, '0'))),
              e('div', { className: 'nw-index-list' }, books.map((row, rowIndex) => e('button', {
                key: row.key,
                type: 'button',
                ref: rowIndex === index ? activeIndexRef : undefined,
                className: `nw-irow ${rowIndex === index ? 'is-active' : ''}`,
                onClick: () => props.onSelect(rowIndex),
                style: { '--nw-accent': coverSpec(row).accent },
              },
                e('span', { className: 'nw-irow-num' }, String(rowIndex + 1).padStart(2, '0')),
                e('span', { className: 'nw-irow-title' }, row.title),
                e('span', { className: 'nw-irow-meta' }, `${row.writtenChapters ?? 0} / ${row.totalChapters || '?'}`),
                e('span', { className: 'nw-irow-arrow' }, '↗'),
              ))),
            ),
            e('section', { className: 'nw-gallery', ref: galleryRef, onWheel },
              e('div', { className: 'nw-glow' }),
              e('div', { key: `number-${number}`, className: 'nw-big-number' }, number),
              e('span', { className: 'nw-hairline' }),
              e('div', { className: 'nw-fan' },
                side(left, 'is-left'),
                e('button', {
                  key: `hero-${book.key}`,
                  type: 'button',
                  className: 'nw-card is-hero',
                  ref: heroRef,
                  onClick: props.onOpen,
                  'aria-label': `${t('shelf.openWorkbench')} · ${book.title}`,
                },
                  e(CoverArt, { book, spec }),
                  e('div', { className: 'nw-open-veil' }, e('span', null, t('shelf.openWorkbench')), e('span', null, '↗')),
                ),
                side(right, 'is-right'),
              ),
              e('div', { className: 'nw-gallery-hint' }, fill(t('shelf.switchHint'), { n })),
            ),
          ),
          e('div', { className: 'nw-footer' }, e('span', null, t('brand.upper')), e('button', { type: 'button', className: 'nw-footer-contact', onClick: () => setContactOpen(true) }, t('contact.entry')), e('span', null, `${number} / ${String(n).padStart(2, '0')}`)),
        ),
        dialog,
        contactDialog,
      )
    }

// ---- 60-workbench.js ----
    /** Drop trailing slashes for path comparisons. */
    function barePath(value) {
      return String(value ?? '').replace(/\/+$/, '')
    }

    /**
     * Pick the book that contains a Session's working directory.
     * @param {object[]} books - scanned books.
     * @param {string | undefined} cwd - Session working directory.
     * @returns {object | null} the best match.
     */
    function pickBookForCwd(books, cwd) {
      const target = barePath(cwd)
      if (target.length === 0) return books[0] ?? null
      return books.find((book) => barePath(book.dir) === target)
        ?? books.find((book) => target.startsWith(`${barePath(book.dir)}/`))
        ?? books.find((book) => barePath(book.root) === target)
        ?? books[0]
        ?? null
    }

    /**
     * Measure the workbench container and pick a layout tier.
     * @param {any} ref - container element ref.
     * @returns {'wide' | 'medium' | 'narrow'} tier.
     */
    function useContainerTier(ref) {
      const [tier, setTier] = useState('wide')
      useEffect(() => {
        const element = ref.current
        if (!element) return undefined
        const update = () => {
          const width = element.clientWidth || 0
          setTier(width >= 1180 ? 'wide' : width >= 900 ? 'medium' : 'narrow')
        }
        update()
        if (typeof ResizeObserver === 'function') {
          const observer = new ResizeObserver(update)
          observer.observe(element)
          return () => observer.disconnect()
        }
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
      }, [ref])
      return tier
    }

    /**
     * Reserve the macOS traffic-light gutter when the page touches the window's
     * left edge: the DSH sidebar is collapsed. Measuring our own root keeps this
     * right when the host sidebar expands again, without reading host internals.
     * @param {any} ref - page root ref.
     * @param {string} route - current route; re-measures after a route swap.
     * @returns {boolean} whether the titlebar inset is needed.
     */
    function useTitlebarInset(ref, route) {
      const [atLeft, setAtLeft] = useState(false)
      const measure = useCallback(() => {
        const element = ref.current
        if (!element || typeof element.getBoundingClientRect !== 'function') return
        setAtLeft(element.getBoundingClientRect().left <= 8)
      }, [ref])
      useLayoutEffect(() => { measure() }, [measure, route])
      useEffect(() => {
        const element = ref.current
        if (!element || typeof ResizeObserver !== 'function') return undefined
        const observer = new ResizeObserver(measure)
        observer.observe(element)
        window.addEventListener('resize', measure)
        return () => { observer.disconnect(); window.removeEventListener('resize', measure) }
      }, [measure, route])
      const hosted = typeof window !== 'undefined' && Boolean(window.__DSH_BOOT__)
      const mac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent || '')
      return hosted && mac && atLeft
    }

    /** Read one stored string. */
    function readStore(key) {
      try { return globalThis.localStorage?.getItem(key) ?? null } catch { return null }
    }

    /** Write one stored string. */
    function writeStore(key, value) {
      try {
        if (value === null) { globalThis.localStorage?.removeItem(key) } else { globalThis.localStorage?.setItem(key, value) }
      } catch { /* private mode */ }
    }

    /** Read one JSON value, ignoring malformed leftovers. */
    function readJsonStore(key) {
      const raw = readStore(key)
      if (!raw) return null
      try {
        const value = JSON.parse(raw)
        return value && typeof value === 'object' ? value : null
      } catch {
        return null
      }
    }

    /** Write one JSON value. */
    function writeJsonStore(key, value) {
      writeStore(key, value === null ? null : JSON.stringify(value))
    }

    /** One saved workbench view, normalized to the current category/selection vocabulary. */
    const SELECTION_KINDS = new Set(['chapter', 'character', 'outline', 'premise', 'memory', 'reviews', 'tracking'])
    const CHAPTER_VIEWS = new Set(['text', 'outline', 'review', 'memory'])
    const CHARACTER_VIEWS = new Set(['profile', 'state'])
    const TRACKING_TABS = new Set(['progress', 'summaries', 'foreshadowing', 'characters'])

    /**
     * Keep only the parts of a view that still mean something after a reload:
     * a known category, a known selection, and a known sub-view. File and world
     * selections are dropped because their paths can disappear.
     * @param {object | null | undefined} view - candidate view.
     * @returns {object} normalized view.
     */
    function sanitizeWorkbenchView(view) {
      const source = view && typeof view === 'object' ? view : {}
      let selection = null
      if (source.selection && typeof source.selection === 'object' && SELECTION_KINDS.has(source.selection.kind)) {
        selection = { kind: source.selection.kind }
        for (const key of ['chapter', 'name']) {
          if (source.selection[key] !== undefined && source.selection[key] !== null) selection[key] = source.selection[key]
        }
        if (selection.kind === 'chapter') {
          const number = Number(selection.chapter)
          if (Number.isInteger(number) && number > 0) selection.chapter = number
          else selection = null
        } else if (selection.kind === 'character') {
          selection.name = String(selection.name ?? '')
          if (!selection.name) selection = null
        }
      }
      let category = CATEGORIES.some((item) => item.id === source.category) ? source.category : 'overview'
      if (selection) {
        const kind = selection.kind
        category = kind === 'chapter' ? 'manuscript' : kind === 'character' ? 'settings' : kind === 'outline' || kind === 'premise' ? 'blueprint' : 'materials'
      }
      return {
        v: 1,
        category,
        selection,
        chapterView: CHAPTER_VIEWS.has(source.chapterView) ? source.chapterView : 'text',
        characterView: CHARACTER_VIEWS.has(source.characterView) ? source.characterView : 'profile',
        trackingTab: TRACKING_TABS.has(source.trackingTab) ? source.trackingTab : 'progress',
      }
    }

    /** Per-book page memory: leaving the workbench and coming back keeps the page. */
    const BOOK_VIEW_PREFIX = 'nw.view:'
    function readBookView(bookKey) {
      if (!bookKey) return null
      const value = readJsonStore(`${BOOK_VIEW_PREFIX}${bookKey}`)
      return value ? sanitizeWorkbenchView(value) : null
    }
    function writeBookView(bookKey, view) {
      if (!bookKey) return
      writeJsonStore(`${BOOK_VIEW_PREFIX}${bookKey}`, sanitizeWorkbenchView(view))
    }

    /** Right-sidebar panel memory: which chapter was open, and whether it was reading. */
    const PANEL_VIEW_PREFIX = 'nw.panel:'
    function readPanelView(bookKey) {
      if (!bookKey) return null
      const value = readJsonStore(`${PANEL_VIEW_PREFIX}${bookKey}`)
      if (!value) return null
      const chapter = Number(value.chapter)
      return {
        chapter: Number.isInteger(chapter) && chapter > 0 ? chapter : null,
        view: value.view === 'reader' ? 'reader' : 'board',
      }
    }
    function writePanelView(bookKey, value) {
      if (!bookKey) return
      writeJsonStore(`${PANEL_VIEW_PREFIX}${bookKey}`, {
        chapter: Number.isInteger(value?.chapter) ? value.chapter : null,
        view: value?.view === 'reader' ? 'reader' : 'board',
      })
    }

    /** A one-shot "open the full workbench at this section" request from the side panel. */
    const PENDING_VIEW_KEY = 'nw.pendingView'
    function readPendingView() {
      const value = readJsonStore(PENDING_VIEW_KEY)
      if (!value || typeof value !== 'object') return null
      if (value.at && Date.now() - Number(value.at) > 2 * 60 * 1000) return null
      return value
    }
    function writePendingView(target) {
      writeJsonStore(PENDING_VIEW_KEY, target ? { ...target, at: Date.now() } : null)
    }

    /**
     * One in-flight background write, stored per book. A page switch or a
     * component remount otherwise loses the writing scene even though the
     * Agent keeps running, which leaves only a disabled "写本章" button.
     */
    const WRITING_KEY_PREFIX = 'nw.write:'
    const WRITING_MAX_AGE = 45 * 60 * 1000
    function readWritingState(bookKey) {
      if (!bookKey) return null
      const value = readJsonStore(`${WRITING_KEY_PREFIX}${bookKey}`)
      if (!value || typeof value !== 'object') return null
      const chapter = Number(value.chapter)
      const startedAt = Number(value.startedAt)
      if (!Number.isInteger(chapter) || chapter <= 0 || !Number.isFinite(startedAt)) return null
      if (Date.now() - startedAt > WRITING_MAX_AGE) {
        writeJsonStore(`${WRITING_KEY_PREFIX}${bookKey}`, null)
        return null
      }
      const baseline = value.baseline && typeof value.baseline === 'object' ? value.baseline : {}
      return {
        bookKey,
        chapter,
        // A saved "starting" phase can no longer be observed directly; treat
        // it as running so the elapsed clock and the 4-second poll resume.
        state: 'running',
        startedAt,
        sessionId: typeof value.sessionId === 'string' ? value.sessionId : null,
        baseline: {
          hasText: Boolean(baseline.hasText),
          mtime: Number(baseline.mtime) || 0,
          words: Number(baseline.words) || 0,
        },
      }
    }
    function writeWritingState(bookKey, value) {
      if (!bookKey || !value) return
      writeJsonStore(`${WRITING_KEY_PREFIX}${bookKey}`, {
        chapter: value.chapter,
        startedAt: value.startedAt,
        sessionId: value.sessionId ?? null,
        baseline: value.baseline ?? null,
      })
    }
    function clearWritingState(bookKey) {
      if (!bookKey) return
      writeJsonStore(`${WRITING_KEY_PREFIX}${bookKey}`, null)
    }

    /**
     * The novel plugin's page: shelf, data loading, and the workbench shell.
     * @param {object} props - slot props plus t/writeChapter/session helpers.
     * @returns {any} the page.
     */
    function NovelApp(props) {
      const t = props.t
      const isSession = props.mode === 'session'
      const [books, setBooks] = useState([])
      const [libraryDir, setLibraryDir] = useState('')
      const [scanState, setScanState] = useState('loading')
      const [scanError, setScanError] = useState('')
      const [shelfKey, setShelfKey] = useState(() => readStore('nw.shelfKey'))
      // Returning to the page must not flash the shelf first: if the last exit
      // was a book, start on the book shell and let the scan fill it in.
      const initialViewRef = useRef({
        route: readStore('nw.route'),
        bookKey: readStore('nw.lastBook'),
      })
      const resumeBook = !isSession && initialViewRef.current.route === 'book' && Boolean(initialViewRef.current.bookKey)
      const [route, setRoute] = useState(isSession || resumeBook ? 'book' : 'shelf')
      const [bookKey, setBookKey] = useState(() => (resumeBook ? initialViewRef.current.bookKey : null))
      const [viewRestored, setViewRestored] = useState(false)
      const [openedBook, setOpenedBook] = useState(null)
      const [snapshot, setSnapshot] = useState(null)
      const [snapState, setSnapState] = useState('idle')
      const [snapError, setSnapError] = useState('')
      const [shelfSnapshot, setShelfSnapshot] = useState(null)
      const [category, setCategory] = useState('overview')
      const [selection, setSelection] = useState(null)
      const [chapterView, setChapterView] = useState('text')
      const [characterView, setCharacterView] = useState('profile')
      const [trackingTab, setTrackingTab] = useState('progress')
      const [trackingRefreshing, setTrackingRefreshing] = useState(false)
      const [file, setFile] = useState(null)
      const [fileState, setFileState] = useState('idle')
      const [fileError, setFileError] = useState('')
      const [draft, setDraft] = useState('')
      const [editing, setEditing] = useState(false)
      const [saving, setSaving] = useState(false)
      const [saveError, setSaveError] = useState('')
      const [saveNote, setSaveNote] = useState('')
      const [panelWish, setPanelWish] = useState(null)
      const [panelTab, setPanelTab] = useState(isSession ? 'chat' : 'context')
      const [directoryWish, setDirectoryWish] = useState(null)
      const [query, setQuery] = useState('')
      const [collapsed, setCollapsed] = useState({})
      const [confirm, setConfirm] = useState(null)
      const [toast, setToast] = useState(null)
      const [writing, setWriting] = useState(null)
      const [trackedSession, setTrackedSession] = useState(null)
      const [sessionError, setSessionError] = useState('')
      const [sessionOpening, setSessionOpening] = useState(false)
      const [exportOpen, setExportOpen] = useState(false)
      const [exportFormat, setExportFormat] = useState('docx')
      const [exportState, setExportState] = useState('idle')
      const [exportError, setExportError] = useState('')
      const [exportResult, setExportResult] = useState(null)
      const [draftRefresh, setDraftRefresh] = useState(0)
      const rootRef = useRef(null)
      const tier = useContainerTier(rootRef)
      const titlebarInset = useTitlebarInset(rootRef, route)
      const panelOpen = panelWish ?? tier === 'wide'
      const directoryOpen = directoryWish ?? tier !== 'narrow'
      const cacheRef = useRef(new Map())
      const saveRef = useRef(() => {})
      const fileSeqRef = useRef(0)
      const snapSeqRef = useRef(0)
      const bookKeyRef = useRef(null)
      const fileRef = useRef(null)
      const sawRunningRef = useRef(false)
      const pendingViewRef = useRef(readPendingView())
      const needsFileOpenRef = useRef(false)

      const useSessions = props.useSessions ?? (() => undefined)
      const useSessionStatus = props.useSessionStatus ?? (() => undefined)
      const useChat = props.useChat
      const useInput = props.useInput
      const sessionCwd = useSessions((state) => (props.sessionId ? state.byId[props.sessionId]?.cwd : undefined))

      const currentBook = useMemo(() => books.find((book) => book.key === bookKey)
        ?? (openedBook && openedBook.key === bookKey ? openedBook : null), [books, bookKey, openedBook])
      const shelfIndex = useMemo(() => {
        const found = books.findIndex((book) => book.key === shelfKey)
        return found >= 0 ? found : 0
      }, [books, shelfKey])
      const shelfBook = books[shelfIndex] ?? null
      const status = snapshot?.status ?? null
      const dirty = Boolean(file && editing && draft !== file.text)
      // Requests carry the book/file they were sent for; a late response must
      // never paint A's snapshot or A's draft onto B's page.
      bookKeyRef.current = currentBook?.key ?? null
      fileRef.current = file

      /** Load the shelf once, and on manual rescans. */
      const loadBooks = useCallback(async (preferKey) => {
        setScanState('loading')
        setScanError('')
        try {
          const value = await apiGet('books')
          const rows = (Array.isArray(value.books) ? value.books : []).map((book) => ({ ...book, key: `${book.root}|${book.relDir}` }))
          setBooks(rows)
          setLibraryDir(typeof value.libraryDir === 'string' ? value.libraryDir : '')
          setScanState('ready')
          setShelfKey((current) => {
            const wanted = preferKey ?? current
            if (wanted && rows.some((book) => book.key === wanted)) return wanted
            return rows[0]?.key ?? null
          })
          return rows
        } catch (error) {
          setBooks([])
          setScanState('error')
          setScanError(error instanceof Error ? error.message : String(error))
          return []
        }
      }, [])

      useEffect(() => { void loadBooks() }, [loadBooks])

      useEffect(() => { writeStore('nw.shelfKey', shelfKey) }, [shelfKey])

      /**
       * Restore the last page, or honor a one-shot target from the right-side
       * panel, once the shelf scan is ready. In a Session view the book still
       * follows the Session cwd; its last category/selection is restored.
       */
      useEffect(() => {
        if (viewRestored || scanState === 'loading') return
        if (scanState === 'error' || books.length === 0) {
          if (!isSession) setRoute('shelf')
          setViewRestored(true)
          return
        }
        const applyView = (view) => {
          const safe = sanitizeWorkbenchView(view)
          setCategory(safe.category)
          setSelection(safe.selection)
          setChapterView(safe.chapterView)
          setCharacterView(safe.characterView)
          setTrackingTab(safe.trackingTab)
        }
        const targetView = (target) => {
          switch (target.kind) {
            case 'premise': return { category: 'blueprint', selection: { kind: 'premise' } }
            case 'outline': return { category: 'blueprint', selection: { kind: 'outline' } }
            case 'chapter': return { category: 'manuscript', selection: { kind: 'chapter', chapter: target.chapter }, chapterView: target.view ?? 'text' }
            case 'character': return { category: 'settings', selection: { kind: 'character', name: target.name }, characterView: 'profile' }
            case 'manuscript': return { category: 'manuscript', selection: null }
            case 'settings': return { category: 'settings', selection: null }
            case 'tracking': return { category: 'materials', selection: { kind: 'tracking' }, trackingTab: target.tab ?? 'progress' }
            case 'memory': return { category: 'materials', selection: { kind: 'memory' } }
            case 'reviews': return { category: 'materials', selection: { kind: 'reviews' } }
            case 'export': return { category: 'overview', selection: null }
            default: return { category: 'overview', selection: null }
          }
        }

        const pending = pendingViewRef.current
        if (pending) {
          pendingViewRef.current = null
          writePendingView(null)
          const targetBook = books.find((book) => book.key === pending.bookKey)
            ?? books.find((book) => book.key === readStore('nw.lastBook'))
            ?? books[0]
          if (targetBook) {
            setOpenedBook(targetBook)
            setBookKey(targetBook.key)
            setShelfKey(targetBook.key)
            setRoute('book')
            if (!isSession) {
              writeStore('nw.route', 'book')
              writeStore('nw.lastBook', targetBook.key)
            }
            const base = readBookView(targetBook.key) ?? { category: 'overview' }
            applyView({ ...base, ...targetView(pending) })
            needsFileOpenRef.current = pending.kind === 'chapter' || pending.kind === 'character'
            if (pending.kind === 'export') setExportOpen(true)
            setViewRestored(true)
            return
          }
        }

        if (isSession) {
          setRoute('book')
          const match = pickBookForCwd(books, sessionCwd)
          if (match) {
            setBookKey(match.key)
            setShelfKey(match.key)
            const saved = readBookView(match.key)
            if (saved) {
              applyView(saved)
              needsFileOpenRef.current = saved.selection?.kind === 'chapter' || saved.selection?.kind === 'character'
            }
          }
          setViewRestored(true)
          return
        }

        const savedRoute = readStore('nw.route')
        const lastBookKey = readStore('nw.lastBook')
        const targetBook = savedRoute === 'book' && lastBookKey ? books.find((book) => book.key === lastBookKey) ?? null : null
        if (targetBook) {
          setOpenedBook(targetBook)
          setBookKey(targetBook.key)
          setShelfKey(targetBook.key)
          setRoute('book')
          const saved = readBookView(targetBook.key)
          if (saved) {
            applyView(saved)
            needsFileOpenRef.current = saved.selection?.kind === 'chapter' || saved.selection?.kind === 'character'
          }
        } else {
          setRoute('shelf')
        }
        setViewRestored(true)
      }, [books, isSession, scanState, sessionCwd, viewRestored])

      /** Remember the page per book; the main page's shelf/book route is remembered separately. */
      useEffect(() => {
        if (!viewRestored) return
        if (!isSession) {
          if (route === 'shelf') { writeStore('nw.route', 'shelf'); return }
          writeStore('nw.route', 'book')
        }
        if (!currentBook) return
        if (!isSession) writeStore('nw.lastBook', currentBook.key)
        writeBookView(currentBook.key, { category, selection, chapterView, characterView, trackingTab })
      }, [viewRestored, isSession, route, currentBook?.key, category, selection, chapterView, characterView, trackingTab])

      /** A restored chapter or character that no longer exists falls back to its directory. */
      useEffect(() => {
        if (!viewRestored || !snapshot || !selection) return
        if (selection.kind === 'chapter') {
          if (!(snapshot.chapters ?? []).some((row) => row.chapter === selection.chapter)) setSelection(null)
        } else if (selection.kind === 'character') {
          if (!(snapshot.characters ?? []).some((row) => row.name === selection.name)) setSelection(null)
        }
      }, [viewRestored, snapshot, selection])

      /** The shelf preview needs the selected book's synopsis and next chapter. */
      useEffect(() => {
        if (route !== 'shelf' || !shelfBook) { setShelfSnapshot(null); return undefined }
        const cached = cacheRef.current.get(shelfBook.key)
        if (cached) { setShelfSnapshot(cached); return undefined }
        let alive = true
        setShelfSnapshot(null)
        apiGet(`book?root=${encodeURIComponent(shelfBook.root)}&dir=${encodeURIComponent(shelfBook.relDir)}`)
          .then((value) => { if (!alive) return; cacheRef.current.set(shelfBook.key, value); setShelfSnapshot(value) })
          .catch(() => { if (alive) setShelfSnapshot(null) })
        return () => { alive = false }
      }, [route, shelfBook?.key])

      /** Load the open book's full snapshot. */
      const loadSnapshot = useCallback(async (book, quiet) => {
        if (!book) return null
        const seq = snapSeqRef.current + 1
        snapSeqRef.current = seq
        if (!quiet) { setSnapState('loading'); setSnapError('') }
        try {
          const value = await apiGet(`book?root=${encodeURIComponent(book.root)}&dir=${encodeURIComponent(book.relDir)}`)
          if (seq !== snapSeqRef.current || book.key !== bookKeyRef.current) return null
          cacheRef.current.set(book.key, value)
          setSnapshot(value)
          setSnapState('ready')
          return value
        } catch (error) {
          if (seq !== snapSeqRef.current) return null
          if (!quiet) {
            setSnapError(error instanceof Error ? error.message : String(error))
            setSnapState('error')
          } else {
            // A silent refresh that fails must not leave a permanent spinner.
            setSnapState((current) => (current === 'loading' ? 'error' : current))
          }
          return null
        }
      }, [])

      useEffect(() => {
        if (route !== 'book' || !bookKey || !currentBook) return
        const cached = cacheRef.current.get(currentBook.key)
        if (cached) { setSnapshot(cached); setSnapState('ready'); return }
        void loadSnapshot(currentBook, false)
      }, [route, bookKey, currentBook, loadSnapshot])

      const resetFile = useCallback(() => {
        fileSeqRef.current += 1
        setFile(null); setFileState('idle'); setFileError(''); setDraft(''); setEditing(false); setSaveError(''); setSaveNote('')
      }, [])

      /** Save guard: ask before dropping an unsaved draft. */
      function guard(action) {
        if (!(editing && file && draft !== file.text)) { action(); return }
        setConfirm({
          title: t('workbench.discard.title'),
          body: t('workbench.discard.body'),
          keep: t('workbench.discard.keep'),
          leave: t('workbench.discard.leave'),
          onConfirm: () => {
            setConfirm(null)
            setEditing(false)
            setDraft(file?.text ?? '')
            action()
          },
        })
      }

      const openBook = useCallback((book) => {
        if (!book) return
        guard(() => {
          snapSeqRef.current += 1
          setOpenedBook(book)
          setBookKey(book.key)
          setShelfKey(book.key)
          setRoute('book')
          setCategory('overview')
          setSelection(null)
          setChapterView('text')
          setCharacterView('profile')
          setTrackingTab('progress')
          resetFile()
          setPanelTab(isSession ? 'chat' : 'context')
          setPanelWish(null)
          setDirectoryWish(null)
          setQuery('')
          const cached = cacheRef.current.get(book.key)
          if (cached) { setSnapshot(cached); setSnapState('ready') } else { setSnapshot(null); setSnapState('loading') }
        })
      }, [draft, editing, file, isSession, resetFile, tier])

      const handleCreated = useCallback(async (created) => {
        // Open the book immediately from the create response; the shelf scan can
        // take a moment to see a freshly registered Workspace. This keeps the
        // dialog from staying open with a scary "not refreshed" warning.
        const book = {
          key: `${created.root}|${created.dir}`,
          root: created.root,
          relDir: created.dir,
          title: created.title,
          workspaceId: created.workspaceId ?? null,
          writtenChapters: 0,
          totalChapters: null,
          wordsPerChapter: null,
        }
        openBook(book)
        setToast(fill(t('create.done'), { title: created.title }))
        const findCreated = (rows) => rows.find((row) => row.root === created.root && row.relDir === created.dir)
          ?? rows.find((row) => row.title === created.title && (!created.workspaceId || row.workspaceId === created.workspaceId))
          ?? rows.find((row) => row.root === created.root)
        // Retry the shelf scan in the background; a new Workspace may take a
        // tick to show up in the registry's list.
        let rows = await loadBooks(book.key)
        let found = findCreated(rows)
        for (const delay of [160, 320, 640]) {
          if (found) break
          await new Promise((resolve) => setTimeout(resolve, delay))
          rows = await loadBooks(book.key)
          found = findCreated(rows)
        }
        if (!found && created.warning) setToast(created.warning)
        return { ok: true }
      }, [loadBooks, openBook, t])

      const backToShelf = useCallback(() => {
        guard(() => {
          setRoute(isSession ? 'book' : 'shelf')
          if (!isSession) {
            if (bookKey) setShelfKey(bookKey)
            setSnapshot(null)
            setSnapState('idle')
            setSelection(null)
            resetFile()
          }
        })
      }, [bookKey, draft, editing, file, isSession, resetFile])

      const openPath = useCallback(async (path, options = {}) => {
        if (!currentBook || !path) { resetFile(); return }
        setFileState('loading')
        setFileError('')
        setSaveError('')
        setSaveNote('')
        const seq = fileSeqRef.current + 1
        fileSeqRef.current = seq
        const bookKey = currentBook.key
        try {
          const value = await apiGet(`file?root=${encodeURIComponent(currentBook.root)}&dir=${encodeURIComponent(currentBook.relDir)}&path=${encodeURIComponent(path)}`)
          if (seq !== fileSeqRef.current || bookKey !== bookKeyRef.current) return
          setFile(value)
          setDraft(value.text ?? '')
          setEditing(false)
          setFileState('ready')
          if (options.readOnly) setSaveNote(t('workbench.readonly'))
        } catch (error) {
          if (seq !== fileSeqRef.current) return
          setFile(null)
          setFileState('error')
          setFileError(error instanceof Error ? error.message : String(error))
        }
      }, [currentBook, resetFile, t])

      /** The restored/pending chapter or character loads its text once the snapshot is ready. */
      useEffect(() => {
        if (!needsFileOpenRef.current || !snapshot || !selection || !currentBook) return
        needsFileOpenRef.current = false
        if (selection.kind === 'chapter' && chapterView === 'text') {
          const row = (snapshot.chapters ?? []).find((item) => item.chapter === selection.chapter)
          if (row?.path) void openPath(row.path)
        } else if (selection.kind === 'character' && characterView === 'profile') {
          const row = (snapshot.characters ?? []).find((item) => item.name === selection.name)
          if (row?.path) void openPath(row.path)
        }
      }, [chapterView, characterView, currentBook, openPath, selection, snapshot])

      const chapterRow = useCallback((chapter) => (snapshot?.chapters ?? []).find((row) => row.chapter === chapter) ?? null, [snapshot])

      const openChapter = useCallback((row, view = 'text') => {
        if (!row) return
        guard(() => {
          setCategory('manuscript')
          setSelection({ kind: 'chapter', chapter: row.chapter, path: row.path ?? null })
          setChapterView(view)
          setPanelTab(isSession ? 'chat' : 'context')
          if (view === 'text' && row.path) void openPath(row.path)
          else resetFile()
        })
      }, [draft, editing, file, isSession, openPath, resetFile])

      const changeChapterView = useCallback((view) => {
        if (!selection || selection.kind !== 'chapter') return
        const row = chapterRow(selection.chapter)
        guard(() => {
          setChapterView(view)
          if (view === 'text' && row?.path) void openPath(row.path)
          else resetFile()
        })
      }, [chapterRow, draft, editing, file, openPath, resetFile, selection])

      const openCharacter = useCallback((row) => {
        if (!row) return
        guard(() => {
          setCategory('settings')
          setSelection({ kind: 'character', name: row.name, path: row.path ?? null })
          setCharacterView('profile')
          if (row.path) void openPath(row.path)
          else resetFile()
        })
      }, [draft, editing, file, openPath, resetFile])

      const changeCharacterView = useCallback((view) => {
        if (!selection || selection.kind !== 'character') return
        const row = (snapshot?.characters ?? []).find((item) => item.name === selection.name)
        guard(() => {
          setCharacterView(view)
          if (view === 'profile' && row?.path) void openPath(row.path)
          else resetFile()
        })
      }, [draft, editing, file, openPath, resetFile, selection, snapshot])

      const openWorld = useCallback((row) => {
        if (!row) return
        guard(() => {
          setCategory('settings')
          setSelection({ kind: 'world', name: row.name, path: row.path })
          resetFile()
          void openPath(row.path)
        })
      }, [draft, editing, file, openPath, resetFile])

      const openFile = useCallback((path, label, kind = 'file') => {
        guard(() => {
          setSelection({ kind, path, label, name: label })
          resetFile()
          void openPath(path)
        })
      }, [draft, editing, file, openPath, resetFile])

      const openOutline = useCallback(() => {
        guard(() => { setCategory('blueprint'); setSelection({ kind: 'outline' }); resetFile() })
      }, [draft, editing, file, resetFile])
      const openPremise = useCallback(() => {
        guard(() => { setCategory('blueprint'); setSelection({ kind: 'premise' }); resetFile() })
      }, [draft, editing, file, resetFile])
      const openMemory = useCallback(() => {
        guard(() => { setCategory('materials'); setSelection({ kind: 'memory' }); resetFile() })
      }, [draft, editing, file, resetFile])
      const openTracking = useCallback((tab = 'progress') => {
        guard(() => {
          setCategory('materials')
          setSelection({ kind: 'tracking' })
          setTrackingTab(tab)
          resetFile()
        })
      }, [draft, editing, file, resetFile])
      const openReviews = useCallback(() => {
        guard(() => { setCategory('materials'); setSelection({ kind: 'reviews' }); resetFile() })
      }, [draft, editing, file, resetFile])
      const openMemo = useCallback(async () => {
        if (!currentBook) return
        if (!snapshot?.book?.memo) {
          try {
            await apiPost('tracking/refresh', { root: currentBook.root, dir: currentBook.relDir })
            await loadSnapshot(currentBook, true)
          } catch (error) {
            setToast(`${t('tracking.failed')}：${error instanceof Error ? error.message : String(error)}`)
            return
          }
        }
        openFile('tracking/写作备忘.md', t('tracking.memo'))
      }, [currentBook, loadSnapshot, openFile, snapshot?.book?.memo, t])

      const selectCategory = useCallback((id) => {
        if (id === 'overview') {
          guard(() => { setCategory('overview'); setSelection(null); resetFile() })
          return
        }
        setCategory(id)
        setDirectoryWish(true)
      }, [draft, editing, file, resetFile, tier])

      /**
       * Save the open file. Chapter editing stays on the page after a save so
       * the writing loop is not interrupted; every other editor keeps the old
       * save-and-close behaviour. `exit: true` forces the close.
       * @param {{ exit?: boolean }} [options] - whether to leave edit mode.
       */
      const save = useCallback(async (options = {}) => {
        if (!currentBook || !file || saving) return
        const exit = options.exit ?? selection?.kind !== 'chapter'
        const bookKey = currentBook.key
        const filePath = file.path
        setSaving(true)
        setSaveError('')
        setSaveNote('')
        try {
          const saved = await apiPut('file', {
            root: currentBook.root,
            dir: currentBook.relDir,
            path: file.path,
            text: draft,
            expectedMtime: file.mtime,
            expectedSize: file.size,
          })
          if (bookKey !== bookKeyRef.current || filePath !== fileRef.current?.path) return
          setFile((current) => (current ? { ...current, text: draft, mtime: saved.mtime, size: saved.size, truncated: false } : current))
          if (exit) setEditing(false)
          setSaveNote(t('workbench.saved'))
          void loadSnapshot(currentBook, true)
        } catch (error) {
          if (bookKey === bookKeyRef.current && filePath === fileRef.current?.path) {
            setSaveError(error instanceof Error ? error.message : String(error))
          }
        } finally {
          setSaving(false)
        }
      }, [currentBook, draft, file, loadSnapshot, saving, selection?.kind, t])
      saveRef.current = save

      /** Leave edit mode and drop the draft, asking first when it is dirty. */
      const cancelEditing = useCallback(() => {
        const close = () => {
          setEditing(false)
          setDraft(file?.text ?? '')
          setSaveError('')
          setSaveNote('')
        }
        if (!(editing && file && draft !== file.text)) { close(); return }
        setConfirm({
          title: t('workbench.discard.title'),
          body: t('workbench.discard.body'),
          keep: t('workbench.discard.keep'),
          leave: t('workbench.discard.leave'),
          onConfirm: () => { setConfirm(null); close() },
        })
      }, [draft, editing, file, t])

      /** Finish editing: save a dirty draft, then go back to the reading view. */
      const finishEditing = useCallback(() => {
        if (editing && file && draft !== file.text) { void save({ exit: true }); return }
        setEditing(false)
        setDraft(file?.text ?? '')
        setSaveError('')
        setSaveNote('')
      }, [draft, editing, file, save])
      const finishRef = useRef(() => {})
      finishRef.current = finishEditing

      useEffect(() => {
        if (!editing) return undefined
        const onKey = (event) => {
          if (event.isComposing) return
          if ((event.metaKey || event.ctrlKey) && String(event.key).toLowerCase() === 's') {
            event.preventDefault()
            saveRef.current()
            return
          }
          if (event.key === 'Escape' && !confirm && selection?.kind === 'chapter') {
            event.preventDefault()
            finishRef.current()
          }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [editing, confirm, selection?.kind])

      useEffect(() => {
        if (!dirty) return undefined
        const onBefore = (event) => { event.preventDefault(); event.returnValue = '' }
        window.addEventListener('beforeunload', onBefore)
        return () => window.removeEventListener('beforeunload', onBefore)
      }, [dirty])

      /** Writing Session status + task polling. */
      useEffect(() => {
        if (!currentBook || !props.readWritingSessionId) { setTrackedSession(null); return }
        setTrackedSession(props.readWritingSessionId(currentBook))
      }, [currentBook, props.readWritingSessionId, draftRefresh])

      const trackedStatus = useSessionStatus((statuses) => (trackedSession ? statuses.get(trackedSession) : undefined))
      const trackedRunning = trackedStatus?.running === true
      const trackedWaiting = trackedStatus?.pendingInteraction !== undefined
      const runningNow = writing?.state === 'starting' || writing?.state === 'running' || trackedRunning

      const startWrite = useCallback(async (chapter) => {
        if (!currentBook || !props.writeChapter) return
        if (writing && (writing.state === 'starting' || writing.state === 'running')) return
        const row = chapterRow(chapter)
        const baseline = { hasText: Boolean(row?.hasText), mtime: row?.mtime ?? 0, words: row?.words ?? 0 }
        const bookKey = currentBook.key
        const base = { bookKey, chapter, baseline }
        // Persist immediately, before the first await: if the author leaves the
        // page in the starting moment, the chapter scene still comes back.
        const record = (next) => {
          setWriting(next)
          if (next.state === 'starting' || next.state === 'running') writeWritingState(bookKey, next)
          else clearWritingState(bookKey)
        }
        // Starting a write on the open chapter puts the page into its writing
        // scene; from the overview the current page is left untouched.
        if (selection?.kind === 'chapter' && selection.chapter === chapter) setChapterView('text')
        record({ ...base, state: 'starting', startedAt: Date.now() })
        try {
          const result = await props.writeChapter(currentBook, chapter, {
            hasText: baseline.hasText,
            hasOutline: Boolean(row?.hasOutline),
          })
          if (result?.sessionId) setTrackedSession(result.sessionId)
          record({ ...base, sessionId: result?.sessionId ?? null, state: 'running', startedAt: Date.now() })
          setDraftRefresh((value) => value + 1)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          record({ ...base, state: 'error', error: message })
          setToast(message)
        }
      }, [chapterRow, currentBook, props.writeChapter, selection, setToast, writing])

      /** Restore an in-flight write after the page was hidden or remounted. */
      useEffect(() => {
        const key = currentBook?.key ?? null
        setWriting((current) => {
          if (!key) return null
          if (current?.bookKey === key) return current
          const saved = readWritingState(key)
          return saved ? { ...saved, bookKey: key } : null
        })
      }, [currentBook?.key])

      /** Keep the recoverable phase on disk; remove it once the write ends. */
      useEffect(() => {
        if (!writing?.bookKey) return
        if (writing.state === 'starting' || writing.state === 'running') writeWritingState(writing.bookKey, writing)
        else clearWritingState(writing.bookKey)
      }, [writing])

      useEffect(() => {
        if (!currentBook || !writing || writing.state !== 'running') return undefined
        if (writing.bookKey && writing.bookKey !== currentBook.key) return undefined
        let alive = true
        let busy = false
        const startedAt = writing.startedAt ?? Date.now()
        const timer = setInterval(() => {
          if (!alive || busy) return
          busy = true
          apiGet(`book?root=${encodeURIComponent(currentBook.root)}&dir=${encodeURIComponent(currentBook.relDir)}`)
            .then((value) => {
              if (!alive) return
              const row = (value.chapters ?? []).find((item) => item.chapter === writing.chapter)
              const baseline = writing.baseline ?? { hasText: false, mtime: 0, words: 0 }
              const changed = Boolean(row?.hasText) && (!baseline.hasText
                || row.mtime !== baseline.mtime
                || row.words !== baseline.words)
              if (changed || Date.now() - startedAt > 10 * 60 * 1000) {
                setWriting((current) => (current ? { ...current, state: 'done' } : current))
                cacheRef.current.set(currentBook.key, value)
                setSnapshot(value)
                setDraftRefresh((token) => token + 1)
              }
            })
            .catch(() => {})
            .finally(() => { busy = false })
        }, 4000)
        // Browser timers have no unref; the test/preview runtime does. Without
        // this, a headless run that stays in the writing state would never exit.
        if (timer && typeof timer.unref === 'function') timer.unref()
        return () => { alive = false; clearInterval(timer) }
      }, [writing?.state, writing?.chapter, writing?.startedAt, currentBook])

      /**
       * Keep the open chapter's prose in sync with the snapshot. This is what
       * reveals a finished background write (new file or rewritten mtime),
       * including a session that ended without a persisted chapter record.
       * It also picks up an external edit on a manual rescan. Only the open
       * chapter's text view is touched, and an active editor is never replaced.
       */
      useEffect(() => {
        if (!currentBook || !snapshot || editing) return
        if (selection?.kind !== 'chapter' || chapterView !== 'text') return
        if (fileState === 'loading' || fileState === 'error') return
        const row = (snapshot.chapters ?? []).find((item) => item.chapter === selection.chapter)
        if (!row?.path) return
        if (file?.path === row.path && file?.mtime === row.mtime) return
        void openPath(row.path)
      }, [currentBook, snapshot, editing, selection, chapterView, fileState, file?.path, file?.mtime, openPath])

      /** A restored write whose chapter already changed while away is done. */
      useEffect(() => {
        if (!currentBook || !writing || writing.state !== 'running' || !snapshot) return
        if (writing.bookKey && writing.bookKey !== currentBook.key) return
        const row = (snapshot.chapters ?? []).find((item) => item.chapter === writing.chapter)
        const baseline = writing.baseline ?? { hasText: false, mtime: 0, words: 0 }
        const changed = Boolean(row?.hasText) && (!baseline.hasText
          || row.mtime !== baseline.mtime
          || row.words !== baseline.words)
        if (!changed) return
        setWriting((current) => (current && current.state === 'running' ? { ...current, state: 'done' } : current))
        setDraftRefresh((token) => token + 1)
      }, [currentBook, snapshot, writing])

      useEffect(() => {
        if (trackedRunning) { sawRunningRef.current = true; return }
        if (!sawRunningRef.current) return
        sawRunningRef.current = false
        setWriting((current) => (current && current.state === 'running' ? { ...current, state: 'done' } : current))
        if (currentBook) void loadSnapshot(currentBook, true)
      }, [trackedRunning, currentBook, loadSnapshot])

      const openExport = useCallback(() => {
        setExportOpen(true)
        setExportError('')
        setExportState('idle')
        setExportResult(null)
      }, [])

      const closeExport = useCallback(() => {
        if (exportState !== 'working') setExportOpen(false)
      }, [exportState])

      const runExport = useCallback(async () => {
        if (!currentBook) return
        setExportState('working')
        setExportError('')
        setExportResult(null)
        try {
          const result = await apiPost('export', {
            root: currentBook.root,
            dir: currentBook.relDir,
            format: exportFormat,
          })
          setExportResult(result)
          setExportState('done')
        } catch (error) {
          setExportError(error instanceof Error ? error.message : String(error))
          setExportState('error')
        }
      }, [currentBook, exportFormat])

      const refreshTrackingNow = useCallback(async () => {
        if (!currentBook || trackingRefreshing) return
        setTrackingRefreshing(true)
        try {
          await apiPost('tracking/refresh', { root: currentBook.root, dir: currentBook.relDir })
          await loadSnapshot(currentBook, true)
          setToast(t('tracking.done'))
        } catch (error) {
          setToast(`${t('tracking.failed')}：${error instanceof Error ? error.message : String(error)}`)
        } finally {
          setTrackingRefreshing(false)
        }
      }, [currentBook, loadSnapshot, t, trackingRefreshing])

      const runJourney = useCallback((action) => {
        if (!action) return
        if (action.kind === 'export') { openExport(); return }
        if (action.kind === 'write') { void startWrite(action.chapter); return }
        if (action.kind === 'agent') {
          if (!props.runPrompt) { setToast(t('write.unavailable')); return }
          const pending = props.runPrompt(currentBook, action.prompt, { open: true })
          if (pending && typeof pending.catch === 'function') {
            pending.catch((error) => setToast(error instanceof Error ? error.message : String(error)))
          }
        }
      }, [currentBook, openExport, props.runPrompt, startWrite, t])

      const startSession = useCallback(async () => {
        if (!props.startWritingSession) return
        setSessionError('')
        setSessionOpening(true)
        try {
          const result = await props.startWritingSession(currentBook)
          if (result && result.ok === false) setSessionError(result.error || t('workbench.failed'))
          else setDraftRefresh((value) => value + 1)
        } catch (error) {
          setSessionError(error instanceof Error ? error.message : String(error))
        } finally {
          setSessionOpening(false)
        }
      }, [currentBook, props.startWritingSession, t])

      useEffect(() => {
        if (!toast) return undefined
        const timer = setTimeout(() => setToast(null), 4200)
        return () => clearTimeout(timer)
      }, [toast])

      useEffect(() => {
        if (!confirm) return undefined
        const onKey = (event) => { if (event.key === 'Escape') setConfirm(null) }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [confirm])

      const openSession = (sessionId) => {
        if (sessionId && typeof props.openWritingSession === 'function') props.openWritingSession(sessionId)
      }

      const app = {
        t, isSession, books, scanState, scanError, shelfBook, shelfIndex, shelfSnapshot,
        book: currentBook, snapshot, status, snapState, snapError,
        journey: snapshot?.journey ?? null,
        onJourney: runJourney,
        onOpenExport: openExport,
        trackingTab, trackingRefreshing,
        onOpenTracking: openTracking,
        onTrackingTab: setTrackingTab,
        onRefreshTracking: () => void refreshTrackingNow(),
        category, selection, chapterView, characterView, file, fileState, fileError,
        draft, editing, saving, saveError, saveNote, dirty, readOnly: Boolean((selection && isProtectedPath(selection.path)) || file?.truncated),
        panelOpen, panelTab, directoryOpen, tier, query, collapsed, writing, trackedSession,
        trackedRunning, trackedWaiting, runningNow, sessionError, sessionOpening,
        useChat, useInput, sessionId: props.sessionId,
        onShelfSelect: (index) => { setShelfSnapshot(null); setShelfKey(books[index]?.key ?? null) },
        onShelfOpen: () => openBook(shelfBook),
        onRescan: () => { void loadBooks(bookKey); if (route === 'book' && currentBook) void loadSnapshot(currentBook, false) },
        onBackShelf: backToShelf,
        onCategory: selectCategory,
        onOpenChapter: openChapter,
        onOpenCharacter: openCharacter,
        onOpenWorld: openWorld,
        onOpenFile: openFile,
        onOpenOutline: openOutline,
        onOpenPremise: openPremise,
        onOpenMemory: openMemory,
        onOpenReviews: openReviews,
        onOpenMemo: openMemo,
        onChapterView: changeChapterView,
        onCharacterView: changeCharacterView,
        onToggleGroup: (key) => setCollapsed((current) => ({ ...current, [key]: !current[key] })),
        onQuery: setQuery,
        onTogglePanel: () => setPanelWish(!panelOpen),
        onToggleDirectory: () => setDirectoryWish(!directoryOpen),
        onPanelTab: setPanelTab,
        onEdit: () => {
          if (!file) return
          if (isProtectedPath(file.path) || file.truncated) { setToast(file.truncated ? t('file.truncated') : t('workbench.readonly')); return }
          setEditing(true); setDraft(file.text); setSaveNote('')
        },
        onCancel: cancelEditing,
        onFinish: finishEditing,
        onSave: () => void save(),
        // A reload overwrites the draft with the server copy. Ask first when the
        // draft is dirty; otherwise a failed save would lose the only copy.
        onReload: () => {
          if (!file) return
          guard(() => { void openPath(file.path) })
        },
        onDraft: (value) => { setDraft(value); setSaveNote('') },
        onWrite: (chapter) => void startWrite(chapter),
        onNewSession: () => void startSession(),
        exportFormat, exportState, exportError, exportResult,
        onExportFormat: setExportFormat,
        onExport: () => void runExport(),
        onCloseExport: closeExport,
        onOpenSession: openSession,
        onConfirmKeep: () => setConfirm(null),
        onConfirmLeave: () => confirm?.onConfirm?.(),
        toast: toast ? { text: toast } : null,
        setToast,
      }

      if (route === 'shelf' && !isSession) {
        return e(ShelfPage, {
          t,
          books,
          selected: shelfIndex,
          snapshot: shelfSnapshot,
          loading: scanState === 'loading',
          error: scanState === 'error' ? scanError : '',
          libraryDir,
          pickDirectory: props.pickDirectory,
          onCreated: handleCreated,
          onSelect: app.onShelfSelect,
          onOpen: app.onShelfOpen,
          onRescan: app.onRescan,
          rootRef,
          titlebarInset,
        })
      }

      return e('div', { className: `nw-root${titlebarInset ? ' is-mac-titlebar' : ''}`, ref: rootRef },
        e('style', null, CSS),
        e(WorkbenchPage, { app }),
        confirm ? e('div', { className: 'nw-layer', onClick: (event) => { if (event.target === event.currentTarget) setConfirm(null) } },
          e('div', { className: 'nw-dialog', role: 'dialog', 'aria-modal': 'true' },
            e('h2', { className: 'nw-dialog-title' }, confirm.title),
            e('p', { className: 'nw-dialog-body' }, confirm.body),
            e('div', { className: 'nw-dialog-actions' },
              e('button', { type: 'button', className: 'nw-btn is-secondary', onClick: app.onConfirmKeep }, confirm.keep),
              e('button', { type: 'button', className: 'nw-btn is-primary', onClick: app.onConfirmLeave }, confirm.leave),
            ),
          ),
        ) : null,
        exportOpen ? e(ExportDialog, {
          t,
          book: currentBook,
          journey: snapshot?.journey ?? null,
          format: exportFormat,
          state: exportState,
          error: exportError,
          result: exportResult,
          onFormat: setExportFormat,
          onExport: () => void runExport(),
          onAgain: () => void runExport(),
          onClose: closeExport,
        }) : null,
        app.toast ? e('div', { className: 'nw-toast', role: 'status', 'aria-live': 'polite' }, e('span', { className: 'nw-dot is-done' }), app.toast.text) : null,
      )
    }

    /**
     * The workbench shell: app bar, rail, directory, content card, context panel.
     * @param {{ app: object }} props - the page model.
     * @returns {any} the shell.
     */
    function WorkbenchPage({ app }) {
      const { t, book, snapshot, category } = app
      const cat = CATEGORIES.find((item) => item.id === category) ?? CATEGORIES[0]
      const bookTitle = book?.title ?? t('panel.tabTitle')
      const status = app.status
      const writingLabel = app.writing?.chapter && app.trackedWaiting && app.runningNow
        ? fill(t('workbench.waiting'), { no: app.writing.chapter })
        : app.writing?.chapter && app.runningNow
          ? fill(t('workbench.writing'), { no: app.writing.chapter })
          : app.writing?.chapter && app.writing.state === 'done'
            ? fill(t('workbench.done'), { no: app.writing.chapter })
            : app.writing?.state === 'error'
              ? t('write.failed')
              // A restored write has a chapter; a session that is still running
              // without one (started before this build, or lost storage) still
              // deserves a status instead of a silent disabled button.
              : app.trackedRunning
                ? t('workbench.writingUnknown')
                : ''
      const writingTone = app.trackedWaiting ? 'is-waiting' : app.runningNow ? 'is-writing' : app.writing?.state === 'error' ? 'is-error' : 'is-done'

      // One next step per screen: the overview's journey card and a chapter's
      // own empty state own the write action. The app bar carries only status,
      // never a second copy of the same CTA.
      const appbar = e('header', { className: 'nw-appbar' },
        app.isSession ? null : e(IconButton, { glyph: 'home', size: 18, label: t('workbench.back'), tipAlign: 'start', onClick: app.onBackShelf }),
        e(IconButton, { glyph: 'panelLeft', label: t('workbench.directory'), onClick: app.onToggleDirectory, ariaExpanded: app.directoryOpen }),
        e('div', { className: 'nw-divider' }),
        e('div', { className: 'nw-appbar-title' }, bookTitle),
        e('div', { className: 'nw-appbar-sub' }, book?.genre || ''),
        e('div', { className: 'nw-spacer' }),
        writingLabel ? e('button', {
          type: 'button',
          className: `nw-pill ${writingTone}`,
          role: 'status',
          'aria-live': 'polite',
          title: t('write.open'),
          disabled: !(app.writing?.sessionId ?? app.trackedSession),
          onClick: () => app.onOpenSession(app.writing?.sessionId ?? app.trackedSession),
        },
          app.runningNow && !app.trackedWaiting
            ? e('span', { className: 'nw-eq', 'aria-hidden': true }, e('i'), e('i'), e('i'))
            : e('span', { className: 'nw-pill-dot' }),
          writingLabel,
        ) : null,
        app.sessionError ? e('span', { className: 'nw-session-error', title: app.sessionError }, app.sessionError) : null,
        e(IconButton, { glyph: 'plus', label: t('workbench.newSession'), className: 'nw-hide-narrow', disabled: app.sessionOpening, onClick: app.onNewSession }),
        e(IconButton, { glyph: 'refresh', label: t('shelf.rescan'), className: 'nw-hide-narrow', onClick: app.onRescan }),
        e(IconButton, { glyph: 'panelRight', label: t('workbench.contextPanel'), tipAlign: 'end', onClick: app.onTogglePanel, ariaExpanded: app.panelOpen }),
      )

      if (!book) {
        return e('div', { className: 'nw-workbench' }, appbar,
          e('div', { className: 'nw-body' }, e('div', { className: 'nw-work' }, e('section', { className: 'nw-content' },
            app.scanState === 'loading'
              ? e('div', { className: 'nw-empty' }, e('span', { className: 'nw-spinner' }), t('state.loading'))
              : e('div', { className: 'nw-empty' }, e('h2', { className: 'nw-empty-title' }, t('workbench.noBook')), e('p', { className: 'nw-empty-body' }, t('workbench.openFirst'))),
          ))),
        )
      }
      if (app.snapState === 'loading' && !snapshot) {
        return e('div', { className: 'nw-workbench' }, appbar,
          e('div', { className: 'nw-body' }, e('div', { className: 'nw-work' }, e('section', { className: 'nw-content' },
            e('div', { className: 'nw-empty' }, e('span', { className: 'nw-spinner' }), t('state.loading')),
          ))),
        )
      }
      if (app.snapState === 'error') {
        return e('div', { className: 'nw-workbench' }, appbar,
          e('div', { className: 'nw-body' }, e('div', { className: 'nw-work' }, e('section', { className: 'nw-content' },
            e('div', { className: 'nw-empty' }, e('h2', { className: 'nw-empty-title' }, t('state.error')), e('p', { className: 'nw-empty-body' }, app.snapError), e('button', { type: 'button', className: 'nw-btn is-secondary', onClick: app.onRescan }, t('state.retry'))),
          ))),
        )
      }

      return e('div', { className: 'nw-workbench' },
        appbar,
        e('div', { className: 'nw-body' },
          e('aside', { className: 'nw-rail' }, CATEGORIES.map((item) => e('button', {
            key: item.id,
            type: 'button',
            className: `nw-rail-item ${category === item.id ? 'is-active' : ''}`,
            onClick: () => app.onCategory(item.id),
            title: t(item.labelKey),
            'aria-current': category === item.id ? 'page' : undefined,
          }, icon(item.icon, 20), e('span', { className: 'nw-rail-label' }, t(item.labelKey))))),
          e('div', { className: 'nw-work' },
            e(Directory, { app }),
            e('section', { className: 'nw-content' },
              e(ContentHeader, { app }),
              e('div', { className: 'nw-cbody' }, e(ContentView, { app })),
            ),
          ),
          e(ContextPanel, { app }),
        ),
      )
    }

    /**
     * Content header: breadcrumb, title, view switch, actions.
     * @param {{ app: object }} props - the page model.
     * @returns {any} the header.
     */
    function ContentHeader({ app }) {
      const { t, selection, chapterView, characterView, file, readOnly } = app
      const bookTitle = app.book?.title ?? ''
      const isChapterEditing = Boolean(app.editing && selection?.kind === 'chapter')
      let crumbs = t('nav.overview')
      let title = t('workbench.overview')
      let meta = ''
      /** @type {any[]} */
      let tools = []
      const iconButton = (key, glyph, label, onClick, disabled) => e(IconButton, {
        key, glyph, label, onClick, disabled, tipAlign: 'end',
      })
      const saveActions = (prefix) => [
        e('button', { key: `${prefix}-cancel`, type: 'button', className: 'nw-btn is-secondary is-sm', onClick: app.onCancel }, t('workbench.cancel')),
        e('button', { key: `${prefix}-save`, type: 'button', className: 'nw-btn is-primary is-sm', disabled: app.saving, onClick: app.onSave }, app.saving ? t('workbench.saving') : t('workbench.save')),
      ]
      // The view switch stays a tab bar at every width. Narrow toolbars wrap
      // onto a second row and the tab strip scrolls horizontally; a select
      // would hide the relationship between the tabs and the page.
      const viewControls = (options, value, onChange) => e('div', { key: 'views', className: 'nw-seg' },
        options.map(([id, label]) => e('button', {
          key: id, type: 'button', className: value === id ? 'is-active' : '', onClick: () => onChange(id),
        }, label)))
      if (selection?.kind === 'chapter') {
        const chapter = (app.snapshot?.chapters ?? []).find((item) => item.chapter === selection.chapter)
        const chapterOutline = app.snapshot?.chapterOutlines?.[String(selection.chapter)]?.data
        // The body owns the write CTA while it shows the matching empty state
        // (blank chapter, or a chapter without an outline), and the writing
        // scene owns it while the Agent works. Repeating it in the toolbar
        // would put two write actions on one screen.
        const bodyOwnsWrite = (chapterView === 'text' && !chapter?.hasText)
          || (chapterView === 'outline' && !chapterOutline)
        const sceneHere = Boolean(app.writing && app.writing.chapter === selection.chapter
          && (app.runningNow || app.writing.state === 'error'))
        crumbs = `${t('nav.manuscript')} › ${fill(t('workbench.chapterNo'), { no: selection.chapter })}${app.editing ? ` · ${t('workbench.editing')}` : ''}`
        // The page carries the chapter title while editing; repeating it in the
        // toolbar would turn the writing page back into a form header.
        title = app.editing ? '' : chapter?.title || fill(t('workbench.chapterNo'), { no: selection.chapter })
        meta = app.editing ? '' : chapter?.hasText ? fill(t('workbench.words'), { n: (chapter.words ?? 0).toLocaleString() }) : ''
        const actions = app.editing
          ? [
            e('button', { key: 'cancel', type: 'button', className: 'nw-btn is-ghost is-sm', onClick: app.onCancel }, t('workbench.cancel')),
            e('button', { key: 'finish', type: 'button', className: 'nw-btn is-secondary is-sm', disabled: app.saving, onClick: app.onFinish }, t('workbench.finish')),
            e('button', { key: 'save', type: 'button', className: 'nw-btn is-primary is-sm', disabled: app.saving, onClick: app.onSave }, app.saving ? t('workbench.saving') : t('workbench.save')),
          ]
          : [
            iconButton('edit', 'edit', t('workbench.edit'), app.onEdit, !file || readOnly),
            iconButton('reload', 'refresh', t('workbench.reload'), app.onReload, !file),
            bodyOwnsWrite || sceneHere ? null : e('button', { key: 'write', type: 'button', className: 'nw-btn is-primary is-sm', disabled: app.runningNow || app.trackedWaiting, onClick: () => app.onWrite(selection.chapter) }, icon('spark', 14), chapter?.hasText ? t('chapter.rewrite') : t('chapter.write')),
          ].filter(Boolean)
        tools = [
          // Switching views mid-edit would drop the draft, so the switch is
          // hidden while the manuscript is open for editing.
          ...(app.editing ? [] : [viewControls(
            [['text', 'chapter.text'], ['outline', 'chapter.outline'], ['review', 'chapter.review'], ['memory', 'chapter.memory']].map(([id, key]) => [id, t(key)]),
            chapterView,
            app.onChapterView,
          )]),
          ...actions,
        ]
      } else if (selection?.kind === 'character') {
        const character = (app.snapshot?.characters ?? []).find((item) => item.name === selection.name)
        crumbs = `${t('nav.settings')} › ${t('workbench.people')} › ${selection.name}`
        title = selection.name
        meta = STAGE_LABELS[character?.identity?.profileStage] ?? character?.identity?.profileStage ?? ''
        const actions = app.editing
          ? saveActions('character')
          : [e('button', { key: 'edit', type: 'button', className: 'nw-btn is-primary is-sm', disabled: !file || readOnly, onClick: app.onEdit }, icon('edit', 14), t('workbench.edit'))]
        tools = [
          viewControls(
            [['profile', t('character.profile')], ['state', t('character.state')]],
            characterView,
            app.onCharacterView,
          ),
          ...actions,
        ]
      } else if (selection?.kind === 'outline') {
        crumbs = `${t('nav.blueprint')} › ${t('workbench.outline')}`
        title = t('workbench.outline')
      } else if (selection?.kind === 'premise') {
        crumbs = `${t('nav.blueprint')} › ${t('workbench.premise')}`
        title = t('workbench.premise')
      } else if (selection?.kind === 'memory') {
        crumbs = `${t('nav.materials')} › ${t('workbench.memory')}`
        title = t('workbench.memory')
      } else if (selection?.kind === 'reviews') {
        crumbs = `${t('nav.materials')} › ${t('workbench.reviews')}`
        title = t('workbench.reviews')
      } else if (selection?.kind === 'tracking') {
        crumbs = `${t('nav.materials')} › ${t('workbench.tracking')}`
        title = t('workbench.tracking')
        tools = [
          viewControls(
            [['progress', t('tracking.progress')], ['summaries', t('tracking.summaries')], ['foreshadowing', t('tracking.foreshadowing')], ['characters', t('tracking.characters')]],
            app.trackingTab,
            app.onTrackingTab,
          ),
          e('button', {
            key: 'refresh', type: 'button', className: 'nw-btn is-secondary is-sm',
            disabled: app.trackingRefreshing,
            onClick: app.onRefreshTracking,
          }, icon('refresh', 14), app.trackingRefreshing ? t('tracking.refreshing') : t('tracking.refresh')),
        ]
      } else if (selection?.kind === 'world') {
        crumbs = `${t('nav.settings')} › ${t('workbench.world')} › ${selection.name}`
        title = selection.name
        tools = app.editing
          ? saveActions('world')
          : [e('button', { key: 'edit', type: 'button', className: 'nw-btn is-primary is-sm', disabled: !file || readOnly, onClick: app.onEdit }, icon('edit', 14), t('workbench.edit'))]
      } else if (selection?.kind === 'file') {
        crumbs = selection.label || selection.path
        title = selection.name || selection.label || selection.path
        tools = app.editing
          ? saveActions('file')
          : [
            iconButton('edit', 'edit', t('workbench.edit'), app.onEdit, !file || readOnly),
            iconButton('reload', 'refresh', t('workbench.reload'), app.onReload, !file),
          ]
      }
      const isOverview = !selection
      return e('div', { className: `nw-ctoolbar${isChapterEditing ? ' is-editing' : ''}` },
        e('div', { className: 'nw-ctoolbar-lead' },
          e('div', { className: 'nw-crumbs' }, isOverview ? `${bookTitle} › ${t('workbench.overview')}` : crumbs),
          title ? e('div', { className: 'nw-ctitle' }, isOverview ? t('workbench.overview') : title) : null,
        ),
        meta ? e('span', { className: 'nw-muted nw-hide-narrow' }, meta) : null,
        app.saveError ? e('span', { className: 'nw-muted', style: { color: 'var(--nw-danger)' } }, app.saveError) : null,
        app.saveError ? e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', onClick: app.onReload }, t('workbench.reload')) : null,
        app.saveNote && !isChapterEditing ? e('span', { className: 'nw-muted' }, app.saveNote) : null,
        readOnly ? e('span', { className: 'nw-tag is-plain' }, file?.truncated ? t('file.truncated') : t('workbench.readonly')) : null,
        e('div', { className: 'nw-ctools' }, tools),
      )
    }

    /**
     * The book's directory column.
     * @param {{ app: object }} props - the page model.
     * @returns {any} the directory.
     */
    function Directory({ app }) {
      const { t, snapshot, category, selection, query, collapsed } = app
      if (category === 'overview') return null
      if (!snapshot) return e('aside', { className: `nw-directory ${app.directoryOpen ? 'is-open' : ''}` })
      const chapters = snapshot.chapters ?? []
      const volumes = snapshot.volumes ?? []
      const characters = snapshot.characters ?? []
      const world = snapshot.settings?.world ?? []
      const other = snapshot.settings?.other ?? []
      const references = snapshot.settings?.references ?? []
      const groups = []
      const activeChapter = selection?.kind === 'chapter' ? selection.chapter : null
      const activeName = selection?.kind === 'character' || selection?.kind === 'world' ? selection.name : null
      const activePath = selection?.kind === 'file' || selection?.kind === 'world' ? selection.path : null
      // The chapter currently being written is marked in the list, so leaving
      // the chapter page still shows where the Agent is working.
      const writingChapter = app.runningNow && app.writing?.chapter ? app.writing.chapter : null
      const matches = (value) => !query || String(value ?? '').toLowerCase().includes(query.toLowerCase())
      const row = (key, label, meta, active, onClick, dot, metaClass = '') => e('button', {
        key,
        type: 'button',
        className: `nw-row ${active ? 'is-active' : ''}`,
        onClick,
        'aria-current': active ? 'page' : undefined,
      },
        e('span', { className: `nw-dot ${dot ?? 'is-idle'}` }),
        e('span', { className: 'nw-row-label' }, label),
        meta ? e('span', { className: `nw-row-meta ${metaClass}`.trim() }, meta) : null,
      )
      if (category === 'manuscript') {
        const known = new Set(volumes.map((volume) => volume.volumeNo))
        const loose = chapters.filter((chapter) => chapter.volume === null || !known.has(chapter.volume))
        const volumeGroups = volumes.map((volume) => ({
          key: `v${volume.volumeNo}`,
          label: `${fill(t('workbench.volume'), { no: volume.volumeNo })}${volume.title ? ` · ${volume.title}` : ''}`,
          rows: chapters.filter((chapter) => chapter.volume === volume.volumeNo),
        })).filter((group) => group.rows.length > 0)
        if (loose.length > 0) volumeGroups.push({ key: 'loose', label: t('workbench.loose'), rows: loose })
        for (const group of volumeGroups) {
          groups.push({
            key: group.key,
            label: group.label,
            rows: group.rows.filter((chapter) => matches(chapter.title) || matches(fill(t('workbench.chapterNo'), { no: chapter.chapter }))).map((chapter) => row(
              `ch${chapter.chapter}`,
              `${fill(t('workbench.chapterNo'), { no: chapter.chapter })} ${chapter.title}`,
              writingChapter === chapter.chapter ? t('write.writingShort') : chapter.hasText ? String(chapter.words) : '',
              activeChapter === chapter.chapter,
              () => app.onOpenChapter(chapter, 'text'),
              writingChapter === chapter.chapter ? 'is-writing' : chapter.hasText ? (chapter.review?.verdict === 'fail' ? 'is-plan' : 'is-done') : chapter.hasOutline ? 'is-plan' : 'is-idle',
              writingChapter === chapter.chapter ? 'is-live' : '',
            )),
          })
        }
      } else if (category === 'blueprint') {
        groups.push({ key: 'book', label: t('workbench.book'), rows: [
          row('outline', t('workbench.outline'), '', selection?.kind === 'outline', app.onOpenOutline, 'is-done'),
          row('premise', t('workbench.premise'), '', selection?.kind === 'premise', app.onOpenPremise, snapshot.premise ? 'is-done' : 'is-idle'),
        ] })
      } else if (category === 'settings') {
        if (characters.length > 0) groups.push({ key: 'characters', label: t('workbench.people'), rows: characters.filter((item) => matches(item.name)).map((item) => row(
          `char${item.name}`, item.name, STAGE_LABELS[item.identity?.profileStage] ?? '', activeName === item.name, () => app.onOpenCharacter(item), item.path ? 'is-done' : 'is-plan',
        )) })
        if (world.length > 0) groups.push({ key: 'world', label: t('workbench.world'), rows: world.filter((item) => matches(item.name)).map((item) => row(
          `world${item.name}`, item.name, formatBytes(item.bytes), activeName === item.name, () => app.onOpenWorld(item), 'is-done',
        )) })
        if (other.length > 0) groups.push({ key: 'other', label: t('workbench.other'), rows: other.filter((item) => matches(item.name)).map((item) => row(
          `other${item.path}`, item.name, formatBytes(item.bytes), activePath === item.path, () => app.onOpenFile(item.path, item.name), 'is-done',
        )) })
        groups.push({ key: 'instructions', label: t('workbench.instructions'), rows: [
          row('agents', 'AGENTS.md', snapshot.book?.agents ? '✓' : '', selection?.kind === 'file' && selection.path === 'AGENTS.md', () => app.onOpenFile('AGENTS.md', t('workbench.instructions')), snapshot.book?.agents ? 'is-done' : 'is-idle'),
        ] })
      } else if (category === 'materials') {
        groups.push({ key: 'tracking', label: t('workbench.tracking'), rows: [
          row('track-progress', t('tracking.progress'), '', selection?.kind === 'tracking' && app.trackingTab === 'progress', () => app.onOpenTracking('progress'), snapshot.tracking ? 'is-done' : 'is-idle'),
          row('track-summaries', t('tracking.summaries'), '', selection?.kind === 'tracking' && app.trackingTab === 'summaries', () => app.onOpenTracking('summaries'), snapshot.tracking ? 'is-done' : 'is-idle'),
          row('track-foreshadowing', t('tracking.foreshadowing'), '', selection?.kind === 'tracking' && app.trackingTab === 'foreshadowing', () => app.onOpenTracking('foreshadowing'), snapshot.tracking ? 'is-done' : 'is-idle'),
          row('track-characters', t('tracking.characters'), '', selection?.kind === 'tracking' && app.trackingTab === 'characters', () => app.onOpenTracking('characters'), snapshot.tracking ? 'is-done' : 'is-idle'),
          row('track-memo', t('tracking.memo'), snapshot.book?.memo ? '✓' : '', selection?.kind === 'file' && selection.path === 'tracking/写作备忘.md', () => app.onOpenMemo(), snapshot.book?.memo ? 'is-done' : 'is-idle'),
        ] })
        groups.push({ key: 'resources', label: t('workbench.book'), rows: [
          row('memory', t('workbench.memory'), String(snapshot.memoryRecords?.length ?? 0), selection?.kind === 'memory', app.onOpenMemory, 'is-done'),
          row('reviews', t('workbench.reviews'), String(snapshot.reviews?.length ?? 0), selection?.kind === 'reviews', app.onOpenReviews, 'is-done'),
        ] })
        if (references.length > 0) groups.push({ key: 'references', label: t('workbench.references'), rows: references.filter((item) => matches(item.name)).map((item) => row(
          `ref${item.path}`, item.name, formatBytes(item.bytes), activePath === item.path, () => app.onOpenFile(item.path, item.name), 'is-done',
        )) })
      }
      const total = groups.reduce((sum, group) => sum + group.rows.length, 0)
      const catLabel = t(CATEGORIES.find((item) => item.id === category)?.labelKey ?? 'nav.overview')
      // No second "next step" row and no second rescan button here: the app bar
      // owns the one rescan action and the overview owns the one next step.
      return e('aside', { className: `nw-directory ${app.directoryOpen ? 'is-open' : ''}` },
        e('div', { className: 'nw-dir-head' },
          e('h2', null, catLabel),
          e('span', { className: 'nw-dir-count' }, category === 'manuscript' ? fill(t('workbench.chapters'), { n: chapters.length }) : fill(t('workbench.settingsCount'), { n: total })),
        ),
        e('div', { className: 'nw-dir-search' }, icon('search', 14), e('input', { value: query, placeholder: t('workbench.search'), onChange: (event) => app.onQuery(event.target.value) })),
        e('div', { className: 'nw-dir-list' },
          groups.length === 0 ? e('div', { className: 'nw-empty', style: { minHeight: 120, padding: 20 } }, e('span', { className: 'nw-muted' }, t('nav.emptySection'))) : null,
          groups.map((group) => {
            const isCollapsed = collapsed[group.key] === true
            return e('div', { className: 'nw-group', key: group.key },
              e('button', { type: 'button', className: 'nw-group-head', onClick: () => app.onToggleGroup(group.key) },
                icon(isCollapsed ? 'chevronRight' : 'chevronDown', 13),
                group.label,
                e('span', { className: 'nw-group-count' }, String(group.rows.length)),
              ),
              isCollapsed ? null : group.rows,
            )
          }),
        ),
      )
    }

// ---- 70-views.js ----
    /** Display names for the nine premise cards. */
    const CARD_LABELS = {
      genre_contract: '题材读者契约',
      core_hook: '核心钩子',
      golden_finger: '金手指与爽点引擎',
      protagonist_desire: '主角欲望与代价',
      antagonistic_force: '对抗力量',
      central_dramatic_question: '中心戏剧问题',
      world_rules: '世界规则可冲突性',
      narrator_voice: '叙述人称',
      blank_declaration: '留白声明',
    }

    /** Human labels for premise card field keys. */
    const PREMISE_FIELD_LABELS = {
      subgenre: '题材', emotional_tone: '情绪基调', hook: '钩子', question: '问题', world_rule: '世界规则',
      archetype: '叙述原型', tone: '语调', pacing: '节奏', address: '叙述人称', style_keywords: '风格关键词',
    }

    /** Human labels for common premise enum values. */
    const PREMISE_VALUES = {
      third_limited: '第三人称有限', third_person_limited: '第三人称有限', third_omniscient: '第三人称全知',
      first_person: '第一人称', second_person: '第二人称', omniscient: '全知视角', limited: '有限视角',
    }

    /** Profile stages. */
    const STAGE_LABELS = { stub: '简档', sketch: '速写', full: '完整' }

    /** Human labels for common state dimensions when the book has no vocabulary. */
    const DIMENSION_FALLBACK = {
      location: '位置', inventory: '持有物', possession: '持有物', relationship: '关系', knowledge: '认知',
      status: '状态', goal: '目标', emotion: '情绪', health: '身体', ability: '能力', reputation: '名声',
      appearance: '外观', identity: '身份',
    }

    /**
     * Display name for a state dimension. The book's state-vocabulary wins.
     * @param {object} app - page model with snapshot.
     * @param {string} key - dimension key.
     * @returns {string} human label.
     */
    function dimensionLabel(app, key) {
      if (!key) return '—'
      const row = (app.snapshot?.stateVocabulary?.dimensions ?? []).find((dimension) => dimension.key === key || dimension.predicate === key)
      return row?.display_name || row?.displayName || DIMENSION_FALLBACK[key] || key
    }

    /** Human label for a state operation. */
    function operationLabel(value) {
      if (!value) return ''
      return ({ add: '获得', remove: '失去', set: '变为', increase: '增加', decrease: '减少', update: '更新' })[value] ?? value
    }

    /** Human label for a foreshadowing action. */
    function foreshadowingLabel(value) {
      if (!value) return ''
      return ({ plant: '埋设', advance: '推进', payoff: '揭晓', mention: '提及', resolve: '收束' })[value] ?? value
    }

    /** Paths the raw editor must not write. */
    function isProtectedPath(path) {
      const value = String(path ?? '')
      return /^\.narracat\/memory\.db(-wal|-shm)?$/.test(value)
        || /^\.narracat\/(content|documents|materials\/originals|project-memory|units|manuscript-(revisions|drafts)|migration-backups|memory|submissions)\//.test(value)
        || /^\.narracat\/data\/reviews\//.test(value)
        || /^tracking\/(进度|章节摘要|伏笔表|人物状态)\.md$/.test(value)
        || /\.lock$/.test(value)
        || /\.tmp$/.test(value)
    }

    /**
     * Split a manuscript into a title line and paragraphs.
     * @param {string} text - raw markdown.
     * @returns {{ title: string, paragraphs: string[] }} parts.
     */
    function splitManuscript(text) {
      const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n')
      const first = lines.findIndex((line) => line.trim().length > 0)
      let title = ''
      if (first >= 0) {
        const line = lines[first].trim()
        if (line.startsWith('#') || /^第[零一二三四五六七八九十百千0-9]+章/.test(line)) {
          title = line.replace(/^#+\s*/, '')
          lines.splice(first, 1)
        }
      }
      const body = lines.join('\n').trim()
      return { title, paragraphs: body.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean) }
    }

    /**
     * Split a draft for the manuscript editor. Unlike `splitManuscript`, the
     * body keeps every blank line, and the heading marker (`#`, `##`, …) is
     * returned so saving can round-trip the file without rewriting the title
     * line. A first line that is not a heading is treated as prose.
     * @param {string} text - raw draft.
     * @returns {{ title: string, body: string, heading: string }} parts.
     */
    function splitEditDraft(text) {
      const source = String(text ?? '').replace(/\r\n?/g, '\n')
      const lines = source.split('\n')
      const first = lines.findIndex((line) => line.trim().length > 0)
      if (first < 0) return { title: '', body: '', heading: '' }
      const trimmed = lines[first].trim()
      const marker = trimmed.match(/^(#{1,6})\s+/)
      const isHeading = Boolean(marker) || /^第[零一二三四五六七八九十百千0-9]+章/.test(trimmed)
      if (!isHeading) return { title: '', body: source, heading: '' }
      // Drop exactly the one separator line the format uses; any extra blank
      // lines the author typed stay in the body.
      const rest = lines.slice(first + 1)
      if (rest[0] === '') rest.shift()
      return {
        title: trimmed.replace(/^#{1,6}\s*/, ''),
        body: rest.join('\n'),
        heading: marker ? marker[1] : '',
      }
    }

    /** Rebuild a draft from the editor's title and body without touching prose. */
    function joinEditDraft(title, body, heading) {
      const head = String(title ?? '').trim()
      const text = String(body ?? '')
      if (!head) return text
      return `${heading ? `${heading} ` : ''}${head}\n\n${text}`
    }

    /** Count CJK characters and Latin word runs the same way the Host does. */
    function countDraftWords(text) {
      const source = String(text ?? '')
      const cjk = source.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/gu)
      const latin = source
        .replace(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/gu, ' ')
        .match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)
      return (cjk ? cjk.length : 0) + (latin ? latin.length : 0)
    }

    /** m:ss clock for the writing scene. */
    function formatElapsed(ms) {
      const total = Math.max(0, Math.floor(Number(ms) / 1000))
      return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
    }

    /** Decorative prose-line widths, grouped like paragraphs. */
    const WRITING_LINES = [
      [100, 97, 74],
      [94, 100, 88, 56],
      [98, 91, 70, 48],
    ]

    /**
     * The chapter page while the Agent writes. It replaces the old
     * disabled-button page with a live writing surface: what is happening,
     * how long it has taken, a way to watch the session, and placeholder prose
     * that keeps the page from looking stuck.
     * @param {{ app: object, chapter: object }} props - page model and chapter.
     * @returns {any} the writing scene.
     */
    function WritingScene({ app, chapter, compact }) {
      const t = app.t
      const writing = app.writing ?? {}
      const waiting = app.trackedWaiting === true
      const failed = writing.state === 'error'
      const starting = writing.state === 'starting'
      const rewrite = Boolean(writing.baseline?.hasText)
      const [now, setNow] = useState(() => Date.now())
      useEffect(() => {
        // The compact sidebar card has no clock; skipping the tick keeps the
        // panel from re-rendering every second while the Agent works.
        if (failed || compact) return undefined
        const timer = setInterval(() => setNow(Date.now()), 1000)
        if (timer && typeof timer.unref === 'function') timer.unref()
        return () => clearInterval(timer)
      }, [failed, compact])
      const startedAt = Number(writing.startedAt) || now
      const elapsed = formatElapsed(now - startedAt)
      const sessionId = writing.sessionId ?? app.trackedSession ?? null
      const title = failed
        ? t('chapter.writingError')
        : rewrite ? fill(t('chapter.rewritingTitle'), { no: chapter.chapter }) : fill(t('chapter.writingTitle'), { no: chapter.chapter })
      const subtitle = failed
        ? (writing.error || t('chapter.writingErrorHint'))
        : waiting
          ? (compact ? t('panel.writingNowWaiting') : t('chapter.writingWaitingHint'))
          : compact
            ? (rewrite ? t('panel.writingNowRewriteHint') : t('panel.writingNowHint'))
            : (rewrite ? t('chapter.writingEditHint') : t('chapter.writingHint'))
      const meta = starting
        ? t('chapter.writingStarting')
        : failed ? t('chapter.writingErrorHint') : fill(t('chapter.writingElapsed'), { time: elapsed })
      return e('div', {
        className: `nw-writing ${compact ? 'is-compact' : ''} ${failed ? 'is-error' : waiting ? 'is-waiting' : ''}`.trim(),
        'aria-busy': failed ? undefined : 'true',
      },
        e('div', { className: 'nw-writing-head' },
          e('span', { className: 'nw-writing-mark', 'aria-hidden': true }, icon(failed ? 'alert' : 'spark', 18)),
          e('div', { className: 'nw-writing-copy' },
            e('h2', { className: 'nw-writing-title', role: 'status', 'aria-live': 'polite' },
              title,
              !failed && !waiting ? e('span', { className: 'nw-writing-dots', 'aria-hidden': true }, e('i'), e('i'), e('i')) : null,
            ),
            e('p', { className: 'nw-writing-sub' }, subtitle),
          ),
        ),
        failed ? null : e('div', { className: 'nw-writing-bar', role: 'progressbar', 'aria-label': title }, e('i')),
        compact ? null : e('div', { className: 'nw-writing-meta' },
          e('span', { className: 'nw-writing-clock', 'aria-hidden': starting || failed ? 'true' : undefined }, meta),
          starting || failed ? null : e('span', { className: 'nw-writing-sep', 'aria-hidden': true }, '·'),
          starting || failed ? null : e('span', null, waiting ? t('chapter.writingWaiting') : t('chapter.writingAside')),
        ),
        compact ? null : e('div', { className: 'nw-writing-actions' },
          failed
            ? e('button', { type: 'button', className: 'nw-btn is-primary is-sm', onClick: () => app.onWrite(chapter.chapter) }, icon('refresh', 14), t('chapter.writingRetry'))
            : waiting
              ? e('button', { type: 'button', className: 'nw-btn is-primary is-sm', disabled: !sessionId, onClick: () => app.onOpenSession(sessionId) }, icon('arrowRight', 14), t('chapter.writingAnswer'))
              : sessionId
                ? e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', onClick: () => app.onOpenSession(sessionId) }, icon('external', 14), t('chapter.writingOpen'))
                : null,
          failed && sessionId
            ? e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', onClick: () => app.onOpenSession(sessionId) }, icon('external', 14), t('chapter.writingOpen'))
            : null,
          !failed && chapter.hasOutline
            ? e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', onClick: () => app.onChapterView('outline') }, icon('chevronRight', 14), t('chapter.openOutline'))
            : null,
        ),
        failed ? null : e('div', { className: 'nw-skel', 'aria-hidden': true },
          (compact ? WRITING_LINES.slice(0, 2) : WRITING_LINES).map((paragraph, paragraphIndex) => e('p', { key: paragraphIndex },
            paragraph.map((width, lineIndex) => e('i', {
              key: lineIndex,
              style: { width: `${width}%`, animationDelay: `${(paragraphIndex * 3 + lineIndex) * 0.16}s` },
            })),
          )),
        ),
      )
    }

    /**
     * Minimal markdown renderer for the book's prose files.
     * @param {{ text: string, className?: string }} props - raw markdown.
     * @returns {any} the rendered blocks.
     */
    function MarkdownBody(props) {
      const lines = String(props.text ?? '').replace(/\r\n?/g, '\n').split('\n')
      const blocks = []
      let insertedAfterTitle = false
      let paragraph = []
      let list = []
      let listKey = 0
      const flushParagraph = () => {
        if (paragraph.length === 0) return
        blocks.push(e('p', { key: `p${blocks.length}` }, paragraph.join(' ')))
        paragraph = []
      }
      const flushList = () => {
        if (list.length === 0) return
        blocks.push(e('ul', { key: `ul${listKey += 1}`, className: 'nw-md-list' }, list.map((item, index) => e('li', { key: index }, item))))
        list = []
      }
      for (const raw of lines) {
        const line = raw.replace(/\s+$/, '')
        if (line.trim().length === 0) { flushParagraph(); flushList(); continue }
        if (line.startsWith('# ')) {
          flushParagraph(); flushList()
          blocks.push(e('h1', { key: `h1${blocks.length}`, className: 'nw-reading-title' }, line.slice(2).trim()))
          if (!insertedAfterTitle && props.afterTitle) { blocks.push(e('div', { key: 'after-title' }, props.afterTitle)); insertedAfterTitle = true }
          continue
        }
        if (line.startsWith('## ')) { flushParagraph(); flushList(); blocks.push(e('h2', { key: `h2${blocks.length}` }, line.slice(3).trim())); continue }
        if (line.startsWith('### ')) { flushParagraph(); flushList(); blocks.push(e('h3', { key: `h3${blocks.length}` }, line.slice(4).trim())); continue }
        if (line.startsWith('> ')) { flushParagraph(); flushList(); blocks.push(e('blockquote', { key: `q${blocks.length}`, className: 'nw-quote' }, line.slice(2).trim())); continue }
        if (/^[-*]\s+/.test(line)) { flushParagraph(); list.push(line.replace(/^[-*]\s+/, '')); continue }
        if (/^\d+\.\s+/.test(line)) { flushParagraph(); list.push(line.replace(/^\d+\.\s+/, '')); continue }
        paragraph.push(line.trim())
      }
      flushParagraph()
      flushList()
      return e('div', { className: `nw-reading ${props.className ?? ''}` }, blocks.length > 0 ? blocks : e('p', { className: 'nw-muted' }, '—'))
    }

    /**
     * One value row in a structured view.
     * @param {{ label: string, value: any }} props - label and value.
     * @returns {any} the row.
     */
    function Field({ label, value }) {
      if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return null
      return e('div', { className: 'nw-field' },
        e('div', { className: 'nw-field-label' }, label),
        e('div', { className: 'nw-field-value' }, Array.isArray(value) ? value.map((item, index) => e('div', { key: index }, String(item))) : String(value)),
      )
    }


    /**
     * A visible warning when the raw-file API had to truncate a large file.
     * Editing is disabled in that state so saving cannot silently lose content.
     * @param {{ app: object }} props - page model.
     * @returns {any} the notice or null.
     */
    function TruncatedNotice({ app }) {
      if (!app.file?.truncated) return null
      return e('p', { className: 'nw-muted' }, app.t('file.truncated'))
    }

    /** Format choices for the export dialog. */
    const EXPORT_FORMATS = [
      ['docx', 'export.docx'],
      ['html', 'export.html'],
      ['md', 'export.md'],
      ['txt', 'export.txt'],
    ]

    /**
     * Export one finished (or unfinished) book, with the same health checklist
     * the overview shows. The download link is a same-origin API route.
     * @param {object} props - dialog state and callbacks.
     * @returns {any} the modal.
     */
    function ExportDialog(props) {
      const { t, book, journey, format, state, error, result, onFormat, onExport, onAgain, onClose } = props
      const checklist = journey?.checklist ?? []
      const working = state === 'working'
      useEffect(() => {
        const onKey = (event) => { if (event.key === 'Escape' && !working) onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [onClose, working])
      const written = journey?.progress?.written ?? 0
      const href = result && book
        ? API + `export-file?root=${encodeURIComponent(book.root)}&dir=${encodeURIComponent(book.relDir)}&path=${encodeURIComponent(result.path)}`
        : ''
      return e('div', {
        className: 'nw-layer',
        onClick: (event) => { if (event.target === event.currentTarget && !working) onClose() },
      },
        e('div', { className: 'nw-dialog is-wide', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('export.title') },
          e('h2', { className: 'nw-dialog-title' }, t('export.title')),
          e('p', { className: 'nw-dialog-body' }, t('export.lead')),
          result
            ? e('div', { className: 'nw-export-done' },
              e('h3', null, fill(t('export.done'), { chapters: result.chapters, words: (result.words ?? 0).toLocaleString() })),
              e('p', null, fill(t('export.path'), { path: result.path })),
              e('div', { className: 'nw-download' },
                icon('save', 16),
                e('a', { href, download: result.filename }, fill(t('export.download'), { name: result.filename })),
              ),
              e('div', { className: 'nw-check', style: { marginTop: 8 } },
                e('div', { className: 'nw-check-title' }, t('export.checkTitle')),
                checklist.length === 0
                  ? e('div', { className: 'nw-check-row' }, t('export.checkClean'))
                  : checklist.map((item) => e('div', { key: item.id, className: 'nw-check-row' },
                    e('i', { className: `nw-health-dot is-${item.level}` }),
                    e('span', null, e('b', null, item.label), item.detail ? ` · ${item.detail}` : ''),
                  )),
              ),
              e('div', { className: 'nw-dialog-actions' },
                e('button', { type: 'button', className: 'nw-btn is-secondary', onClick: onAgain }, t('export.again')),
                e('button', { type: 'button', className: 'nw-btn is-primary', onClick: onClose }, t('export.close')),
              ),
            )
            : e('div', { className: 'nw-export' },
              e('div', { className: 'nw-form-row' },
                e('span', { className: 'nw-form-label' }, t('export.format')),
                e('div', { className: 'nw-choice-row' },
                  EXPORT_FORMATS.map(([id, key]) => e('button', {
                    key: id, type: 'button',
                    className: `nw-choice ${format === id ? 'is-active' : ''}`,
                    disabled: working,
                    onClick: () => onFormat(id),
                  }, t(key))),
                ),
              ),
              e('div', { className: 'nw-check' },
                e('div', { className: 'nw-check-title' }, t('export.checkTitle')),
                checklist.length === 0
                  ? e('div', { className: 'nw-check-row' }, t('export.checkClean'))
                  : checklist.map((item) => e('div', { key: item.id, className: 'nw-check-row' },
                    e('i', { className: `nw-health-dot is-${item.level}` }),
                    e('span', null, e('b', null, item.label), item.detail ? ` · ${item.detail}` : ''),
                  )),
              ),
              written === 0 ? e('div', { className: 'nw-form-note' }, t('export.noText')) : null,
              error ? e('div', { className: 'nw-form-error' }, error) : null,
              e('div', { className: 'nw-dialog-actions' },
                e('button', { type: 'button', className: 'nw-btn is-secondary', disabled: working, onClick: onClose }, t('export.close')),
                e('button', {
                  type: 'button', className: 'nw-btn is-primary',
                  disabled: working || written === 0,
                  onClick: onExport,
                }, working ? t('export.working') : t('export.button')),
              ),
            ),
        ),
      )
    }

    /**
     * The book synopsis: two lines at rest, the full text on demand. It spans
     * the whole hero width so its edges line up with the cards below.
     * @param {{ text: string, t: Function }} props - synopsis copy.
     * @returns {any} the summary block, or null when there is no synopsis.
     */
    function BookSynopsis({ text, t }) {
      const value = String(text ?? '').trim()
      const [open, setOpen] = useState(false)
      const [clipped, setClipped] = useState(() => value.length > 150)
      const ref = useRef(null)
      useEffect(() => {
        setOpen(false)
        setClipped(value.length > 150)
      }, [value])
      useLayoutEffect(() => {
        const element = ref.current
        if (!element || open) return undefined
        const measure = () => {
          const next = element.scrollHeight > element.clientHeight + 1
          setClipped((current) => (current === next ? current : next))
        }
        measure()
        if (typeof ResizeObserver === 'function') {
          const observer = new ResizeObserver(measure)
          observer.observe(element)
          return () => observer.disconnect()
        }
        window.addEventListener('resize', measure)
        return () => window.removeEventListener('resize', measure)
      }, [value, open])
      if (!value) return null
      return e('div', { className: `nw-ov-summary ${open ? 'is-open' : ''}` },
        e('p', { className: 'nw-ov-desc', ref }, value),
        clipped || open ? e('button', {
          type: 'button',
          className: 'nw-ov-more',
          'aria-expanded': open,
          onClick: () => setOpen((current) => !current),
        }, open ? t('overview.collapse') : t('overview.expand'), icon(open ? 'chevronDown' : 'chevronRight', 13)) : null,
      )
    }

    /**
     * The book's overview page.
     * @param {{ app: object }} props - page model.
     * @returns {any} the overview.
     */
    function OverviewView({ app }) {
      const t = app.t
      const { book, snapshot, status } = app
      const chapters = snapshot?.chapters ?? []
      const journey = snapshot?.journey ?? null
      const action = journey?.action ?? null
      const steps = journey?.stages ?? []
      const stageIndex = journey?.lifecycle ?? 0
      const checklist = journey?.checklist ?? []
      const openItems = checklist.filter((item) => item.level !== 'good')
      const written = status?.writtenChapters ?? book?.writtenChapters ?? 0
      const total = book?.totalChapters ?? 0
      const pct = total > 0 ? Math.min(100, Math.round((written / total) * 100)) : 0
      const nextRow = chapters.find((row) => row.chapter === action?.chapter) ?? null
      const memory = snapshot?.book?.memory ?? {}
      const memoryMissing = status?.memory?.missing?.length ?? 0
      const synopsis = snapshot?.outline?.synopsis || ''
      const [memoryTab, setMemoryTab] = useState(null)
      const foreshadowRegistry = Array.isArray(snapshot?.outline?.foreshadowing) ? snapshot.outline.foreshadowing : []
      const foreshadowStates = snapshot?.foreshadowingStates ?? {}
      const foreshadowRows = Array.from(new Set([
        ...foreshadowRegistry.map((row) => row.id).filter(Boolean),
        ...Object.keys(foreshadowStates),
      ])).map((id) => ({
        id,
        entry: foreshadowRegistry.find((row) => row.id === id) ?? {},
        state: foreshadowStates[id] ?? null,
      }))
      const characterStates = snapshot?.characterStates ?? {}
      const stateSubjects = Object.entries(characterStates).filter(([, dimensions]) => dimensions && typeof dimensions === 'object')
      const stateCount = stateSubjects.reduce((sum, [, dimensions]) => sum + Object.keys(dimensions).length, 0)
      const memoryRecords = snapshot?.memoryRecords ?? []
      const memoryCounts = { foreshadowing: foreshadowRows.length, states: stateCount, memory: memoryRecords.length }
      const defaultTab = memoryCounts.foreshadowing > 0 ? 'foreshadowing' : memoryCounts.states > 0 ? 'states' : memoryCounts.memory > 0 ? 'memory' : 'foreshadowing'
      const activeTab = memoryTab ?? defaultTab
      const STATUS_KEYS = { planned: 'overview.statusPlanned', planted: 'overview.statusPlanted', developing: 'overview.statusDeveloping', revealed: 'overview.statusRevealed' }
      const STATUS_TONES = { planned: 'is-plain', planted: 'is-done', developing: 'is-warn', revealed: 'is-success' }
      const renderForeshadowing = () => foreshadowRows.length === 0
        ? e('p', { className: 'nw-muted nw-mem-empty' }, t('overview.noForeshadowing'))
        : e('div', { className: 'nw-frow-list' }, foreshadowRows.map(({ id, entry, state }) => {
          const status = state?.last_action === 'reveal' ? 'revealed' : state?.last_action === 'develop' ? 'developing' : state?.last_action === 'plant' ? 'planted' : 'planned'
          const typeLabel = entry.type === 'small' ? t('overview.typeSmall') : entry.type === 'medium' ? t('overview.typeMedium') : entry.type === 'major' ? t('overview.typeMajor') : (entry.type ?? '')
          const targetRaw = String(entry.target_reveal ?? '')
          const targetVolume = /^vol-(\d+)$/.exec(targetRaw)
          const targetText = targetVolume
            ? fill(t('overview.revealVolume'), { no: Number(targetVolume[1]) })
            : /^\d+$/.test(targetRaw) ? fill(t('overview.revealTarget'), { no: Number(targetRaw) }) : targetRaw
          const meta = [
            entry.planted_chapter ? fill(t('overview.plantedCh'), { no: entry.planted_chapter }) : '',
            targetText,
            state?.chapter ? fill(t('overview.lastTouched'), { no: state.chapter }) : '',
            typeLabel,
            entry.theme_link ?? '',
          ].filter(Boolean)
          return e('div', { key: id, className: 'nw-frow' },
            e('div', { className: 'nw-frow-id' }, id),
            e('div', { className: 'nw-frow-main' },
              e('p', { className: 'nw-frow-desc' }, entry.description || '—'),
              meta.length > 0 ? e('div', { className: 'nw-frow-meta' }, meta.map((item, index) => e('span', { key: index }, item))) : null,
            ),
            e('span', { className: `nw-tag ${STATUS_TONES[status]}` }, t(STATUS_KEYS[status])),
          )
        }))
      const renderStates = () => stateSubjects.length === 0
        ? e('p', { className: 'nw-muted nw-mem-empty' }, t('overview.noStates'))
        : e('div', { className: 'nw-states' }, stateSubjects.map(([name, dimensions]) => e('div', { key: name, className: 'nw-state-row' },
          e('div', { className: 'nw-state-name' }, name),
          e('div', { className: 'nw-state-dims' }, Object.entries(dimensions).map(([dimension, state]) => e('span', { key: dimension, className: 'nw-state-chip' },
            e('span', { className: 'nw-state-key' }, dimensionLabel(app, dimension)),
            e('span', { className: 'nw-state-value' }, Array.isArray(state.value) ? state.value.join('、') : String(state.value ?? '—')),
            state.chapter ? e('span', { className: 'nw-state-ch' }, fill(t('workbench.chapterNo'), { no: state.chapter })) : null,
          ))),
        )))
      const renderMemory = () => memoryRecords.length === 0
        ? e('p', { className: 'nw-muted nw-mem-empty' }, t('overview.noMemory'))
        : e('div', { className: 'nw-recent' }, memoryRecords.map((record) => e('button', {
          key: record.chapter, type: 'button', className: 'nw-rrow nw-memory-row',
          onClick: () => app.onOpenChapter((snapshot.chapters ?? []).find((row) => row.chapter === record.chapter) ?? { chapter: record.chapter }, 'memory'),
        },
          e('span', { className: 'nw-rrow-no' }, fill(t('workbench.chapterNo'), { no: record.chapter })),
          e('span', { className: 'nw-rrow-title' }, record.summary || '—'),
          e('span', { className: `nw-tag ${record.fresh ? 'is-success' : 'is-warn'}` }, record.fresh ? t('memory.fresh') : t('memory.outdated')),
          e('span', { className: 'nw-rrow-words' }, fill(t('overview.stateCount'), { n: record.state_changes?.length ?? 0 })),
        )))
      const isNew = written === 0 && chapters.length === 0
      return e('div', { className: 'nw-ov' },
        steps.length > 0 ? e('div', { className: 'nw-jsteps', 'aria-label': t('journey.next') },
          steps.map((step, index) => e('div', {
            key: step.id,
            className: `nw-jstep ${index < stageIndex ? 'is-done' : index === stageIndex ? 'is-active' : ''}`,
          },
            e('i', { className: 'nw-jstep-dot' }),
            step.label,
            index < steps.length - 1 ? e('i', { className: 'nw-jstep-line' }) : null,
          )),
        ) : null,
        e('section', { className: 'nw-ov-hero' },
          e('div', { className: 'nw-ov-cover' }, e(CoverArt, { book })),
          e('div', { className: 'nw-ov-main' },
            e('h1', { className: 'nw-ov-title' }, book?.title ?? ''),
            e('div', { className: 'nw-ov-meta' },
              e('span', { className: 'nw-tag is-success' }, written > 0 ? t('shelf.status.writing') : t('shelf.status.empty')),
              book?.genre ? e('span', { className: 'nw-tag' }, book.genre) : null,
            ),
            e('div', { className: 'nw-progress' },
              e('div', { className: 'nw-bar' }, e('i', { style: { width: `${pct}%` } })),
              e('div', { className: 'nw-progress-labels' },
                e('span', null, fill(t('overview.progress'), { done: written, total: total || '?' })),
                e('span', null, `${pct}%`),
              ),
            ),
          ),
          e(BookSynopsis, { text: synopsis, t }),
        ),
        action ? e('section', { className: 'nw-journey' },
          e('div', { className: 'nw-journey-kicker' }, `${t('journey.next')} · ${journey.stageLabel}`),
          e('h2', { className: 'nw-journey-title' }, action.title),
          e('p', { className: 'nw-journey-desc' }, action.description),
          e('div', { className: 'nw-journey-actions' },
            e('button', {
              type: 'button', className: 'nw-btn is-primary',
              disabled: app.runningNow || app.trackedWaiting,
              onClick: () => app.onJourney(action),
            }, icon(action.kind === 'write' ? 'edit' : 'spark', 15), action.label),
            written > 0 && action.kind !== 'export' ? e('button', { type: 'button', className: 'nw-btn is-secondary', onClick: app.onOpenExport }, t('journey.export')) : null,
            nextRow ? e('button', { type: 'button', className: 'nw-btn is-ghost', onClick: () => app.onOpenChapter(nextRow, 'text') }, fill(t('overview.openChapter'), { no: nextRow.chapter })) : null,
          ),
          (journey?.hints ?? []).length > 0 ? e('div', { className: 'nw-journey-hints' },
            journey.hints.map((hint, index) => e('div', { key: index, className: 'nw-journey-hint' }, hint)),
          ) : null,
        ) : null,
        isNew ? null : e('div', { className: 'nw-stats3' },
          e('div', { className: 'nw-bigstat' }, e('b', null, String(written), e('em', null, `/ ${total || '?'}`)), e('span', null, t('overview.written'))),
          e('div', { className: 'nw-bigstat' }, e('b', null, (status?.totalWords ?? 0).toLocaleString()), e('span', null, t('overview.words'))),
          e('div', { className: 'nw-bigstat' }, e('b', null, String(memory.records ?? 0), e('em', null, memoryMissing > 0 ? ` · ${fill(t('overview.memoryMissing'), { n: memoryMissing })}` : '')), e('span', null, t('overview.memory'))),
        ),
        checklist.length > 0 && written > 0 ? e('div', { className: 'nw-health' },
          e('div', { className: 'nw-health-head' },
            icon('check', 13),
            e('span', null, t('journey.health')),
            e('button', { type: 'button', onClick: app.onOpenExport }, openItems.length > 0
              ? `${fill(t('overview.items'), { n: openItems.length })} · ${t('export.detail') ?? '查看'}`
              : (t('export.detail') ?? '查看')),
          ),
          openItems.length === 0
            ? e('div', { className: 'nw-health-row' }, e('i', { className: 'nw-health-dot is-good' }), t('journey.healthGood'))
            : openItems.slice(0, 2).map((item) => e('div', { key: item.id, className: 'nw-health-row' },
              e('i', { className: `nw-health-dot is-${item.level}` }),
              e('span', null, item.label),
            )),
          openItems.length > 2 ? e('div', { className: 'nw-health-note', style: { marginLeft: 14 } }, fill(t('journey.healthMore'), { n: openItems.length - 2 })) : null,
        ) : null,
        e('section', { className: 'nw-section nw-memsection' },
          e('div', { className: 'nw-sec-head' },
            e('h2', null, t('overview.memoryTitle')),
            e('div', { className: 'nw-seg nw-memtabs', role: 'tablist', 'aria-label': t('overview.memoryTitle') },
              [
                ['foreshadowing', t('overview.tabForeshadowing')],
                ['states', t('overview.tabStates')],
                ['memory', t('overview.tabMemory')],
              ].map(([id, label]) => e('button', {
                key: id, type: 'button', role: 'tab', 'aria-selected': activeTab === id, className: activeTab === id ? 'is-active' : '',
                onClick: () => setMemoryTab(id),
              }, label, e('span', { className: 'nw-memcount' }, String(memoryCounts[id] ?? 0)))),
            ),
          ),
          activeTab === 'foreshadowing' ? renderForeshadowing() : activeTab === 'states' ? renderStates() : renderMemory(),
        ),
        e('section', { className: 'nw-section' },
          e('h2', null, t('overview.info')),
          e('div', { className: 'nw-info' },
            e('dl', null,
              e('div', { className: 'nw-kv' }, e('dt', null, t('overview.path')), e('dd', { style: { fontSize: 11, color: 'var(--nw-text-3)' } }, book?.dir ?? '')),
              e('div', { className: 'nw-kv' }, e('dt', null, t('overview.target')), e('dd', null, book?.wordsPerChapter ? fill(t('workbench.words'), { n: book.wordsPerChapter }) : '—')),
            ),
            e('dl', null,
              e('div', { className: 'nw-kv' }, e('dt', null, t('overview.instructions')), e('dd', null, snapshot?.book?.agents ? t('overview.hasInstructions') : t('overview.noInstructions'))),
              e('div', { className: 'nw-kv' }, e('dt', null, t('overview.updated')), e('dd', null, formatTime(book?.updatedAt, t))),
            ),
          ),
        ),
      )
    }

    /**
     * Chapter content: text, outline, review, or memory.
     * @param {{ app: object }} props - page model.
     * @returns {any} the chapter view.
     */
    function ChapterView({ app }) {
      const t = app.t
      const titleRef = useRef(null)
      const bodyRef = useRef(null)
      useEffect(() => {
        if (!app.editing) return
        const titleEl = titleRef.current
        const bodyEl = bodyRef.current
        // Land keyboard users somewhere visible: an empty title first, else the
        // body at its start. The page owns the focus cue, not a box outline.
        const target = titleEl && !String(titleEl.value ?? '').trim() ? titleEl : bodyEl
        if (!target || typeof target.focus !== 'function') return
        target.focus()
        if (target === bodyEl) {
          try { bodyEl.setSelectionRange(0, 0) } catch { /* not a text control in tests */ }
        }
      }, [app.editing])
      const chapter = (app.snapshot?.chapters ?? []).find((row) => row.chapter === app.selection?.chapter)
      if (!chapter) return e('div', { className: 'nw-empty' }, e('h2', { className: 'nw-empty-title' }, t('workbench.noContent')))
      // While the Agent writes this chapter, the page itself becomes the wait
      // state. It takes precedence over the empty state and the loading spinner.
      const writingHere = Boolean(app.writing && app.writing.chapter === chapter.chapter
        && (app.runningNow || app.writing.state === 'error'))
      if (app.chapterView === 'text' && writingHere && !app.editing) return e(WritingScene, { app, chapter })
      if (app.chapterView === 'outline') return e(ChapterOutlineView, { app, chapter })
      if (app.chapterView === 'review') return e(ChapterReviewView, { app, chapter })
      if (app.chapterView === 'memory') return e(ChapterMemoryView, { app, chapter })
      if (!chapter.path) {
        // A running session with no chapter attached can happen after an
        // upgrade from a build without persisted writing state, or if storage
        // was unavailable. Show a real status instead of only a disabled CTA.
        const unknownWrite = app.runningNow && !app.writing
        return e('div', { className: 'nw-empty' },
          e('h2', { className: 'nw-empty-title' }, t('chapter.noText')),
          e('p', { className: 'nw-empty-body' }, t('chapter.noTextHint')),
          unknownWrite ? e('div', { className: 'nw-writing-strip' },
            e('span', { className: 'nw-eq', 'aria-hidden': true }, e('i'), e('i'), e('i')),
            e('span', null, t('workbench.writingUnknown')),
            e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', disabled: !app.trackedSession, onClick: () => app.onOpenSession(app.trackedSession) }, t('write.open')),
          ) : null,
          e('div', { className: 'nw-empty-actions' },
            chapter.hasOutline ? e('button', { type: 'button', className: 'nw-btn is-secondary', onClick: () => app.onChapterView('outline') }, t('chapter.openOutline')) : null,
            e('button', { type: 'button', className: 'nw-btn is-primary', disabled: app.runningNow || app.trackedWaiting, onClick: () => app.onWrite(chapter.chapter) }, icon('spark', 14), unknownWrite ? t('write.writingShort') : t('chapter.write')),
          ),
        )
      }
      if (app.fileState === 'loading') return e('div', { className: 'nw-empty' }, e('span', { className: 'nw-spinner' }), t('state.loading'))
      if (app.fileState === 'error') return e('div', { className: 'nw-empty' }, e('h2', { className: 'nw-empty-title' }, t('state.error')), e('p', { className: 'nw-empty-body' }, app.fileError), e('button', { type: 'button', className: 'nw-btn is-secondary', onClick: app.onReload }, t('state.retry')))
      if (app.editing) {
        const { title, body, heading } = splitEditDraft(app.draft)
        const words = countDraftWords(app.draft)
        return e('div', { className: 'nw-page-edit' },
          e('article', { className: 'nw-reading nw-reading-edit' },
            e('div', { className: 'nw-reading-kicker' },
              e('span', null, fill(t('workbench.words'), { n: words.toLocaleString() })),
              app.dirty
                ? e('span', { className: 'nw-edit-state', role: 'status', 'aria-live': 'polite' }, e('i'), t('workbench.unsaved'))
                : app.saveNote ? e('span', { className: 'nw-edit-state is-saved', role: 'status', 'aria-live': 'polite' }, app.saveNote) : null,
            ),
            e('input', {
              className: 'nw-edit-title',
              ref: titleRef,
              value: title,
              placeholder: t('workbench.untitled'),
              spellCheck: false,
              'aria-label': t('chapter.title'),
              onChange: (event) => app.onDraft(joinEditDraft(event.target.value, body, heading)),
            }),
            e('textarea', {
              className: 'nw-editor nw-editor-page',
              ref: bodyRef,
              value: body,
              spellCheck: false,
              'aria-label': t('chapter.text'),
              onChange: (event) => app.onDraft(joinEditDraft(title, event.target.value, heading)),
            }),
          ),
        )
      }
      const { title: manuscriptTitle, paragraphs } = splitManuscript(app.file?.text ?? '')
      const heading = manuscriptTitle || `${fill(t('workbench.chapterNo'), { no: chapter.chapter })} ${chapter.title}`
      return e('article', { className: 'nw-reading' },
        e('div', { className: 'nw-reading-kicker' },
          e('span', null, fill(t('workbench.words'), { n: (chapter.words ?? 0).toLocaleString() })),
          chapter.hasOutline ? e('span', null, `· ${t('chapter.outline')}`) : null,
          chapter.hasMemory ? e('span', null, `· ${t('chapter.memory')}`) : null,
          e('span', { className: 'nw-spacer' }),
          e('span', null, formatTime(chapter.mtime, t)),
        ),
        e('h1', { className: 'nw-reading-title' }, heading),
        e(TruncatedNotice, { app }),
        paragraphs.map((paragraph, index) => e('p', { key: index }, paragraph)),
      )
    }

    /** Chapter outline view. */
    function ChapterOutlineView({ app, chapter }) {
      const t = app.t
      const outline = app.snapshot?.chapterOutlines?.[String(chapter.chapter)]?.data
      if (!outline) {
        return e('div', { className: 'nw-empty' },
          e('h2', { className: 'nw-empty-title' }, t('chapter.noOutline')),
          e('p', { className: 'nw-empty-body' }, t('chapter.noTextHint')),
          e('div', { className: 'nw-empty-actions' },
            e('button', { type: 'button', className: 'nw-btn is-primary', disabled: app.runningNow || app.trackedWaiting, onClick: () => app.onWrite(chapter.chapter) }, icon('spark', 14), t('chapter.write')),
          ),
        )
      }
      const scenes = Array.isArray(outline.scenes) ? outline.scenes : []
      const storylineNames = new Map((app.snapshot?.outline?.storylines ?? []).map((line) => [line.id, line.name]))
      const storylineItems = Array.isArray(outline.storyline_focus) ? outline.storyline_focus : outline.storyline_focus ? [outline.storyline_focus] : []
      const storyline = storylineItems.map((item) => (typeof item === 'string' ? (storylineNames.get(item) ?? item) : (item?.name ?? item?.id ?? ''))).filter(Boolean).join('、')
      const cast = Array.isArray(outline.characters) ? outline.characters : []
      const sceneCast = scenes.flatMap((scene) => (Array.isArray(scene.characters) ? scene.characters : []))
      const castNames = Array.from(new Set([
        ...(outline.pov_character?.name ? [outline.pov_character.name] : []),
        ...cast.map((person) => person.name),
        ...sceneCast.map((person) => person.name),
      ].filter(Boolean)))
      return e('div', { className: 'nw-reading' },
        e('h1', { className: 'nw-reading-title' }, outline.title || chapter.title),
        e(Field, { label: t('chapter.valueShift'), value: outline.value_shift }),
        e(Field, { label: t('chapter.emotionalStakes'), value: outline.emotional_stakes }),
        e(Field, { label: t('chapter.dramaticFocus'), value: outline.dramatic_focus }),
        e(Field, { label: t('chapter.storylineFocus'), value: storyline }),
        e(Field, { label: t('chapter.pov'), value: outline.pov_character?.name }),
        e(Field, { label: t('chapter.opening'), value: outline.opening }),
        e(Field, { label: t('chapter.whatChanges'), value: outline.what_changes }),
        e(Field, { label: t('chapter.want'), value: outline.protagonist_wants }),
        e(Field, { label: t('chapter.obstacle'), value: outline.obstacle }),
        e(Field, { label: t('chapter.stakes'), value: outline.at_stake }),
        e(Field, { label: t('chapter.readerGets'), value: outline.reader_gets }),
        Array.isArray(outline.beats) && outline.beats.length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('chapter.beats')), e('ol', { className: 'nw-reading-list' }, outline.beats.map((beat, index) => e('li', { key: index }, beat)))) : null,
        scenes.length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('chapter.scenes')),
          scenes.map((scene, index) => e('div', { key: index, className: 'nw-scene' },
            e('div', { className: 'nw-scene-head' }, scene.location ?? ''),
            Array.isArray(scene.characters) && scene.characters.length > 0
              ? e('div', { className: 'nw-tags', style: { marginTop: 6 } }, scene.characters.map((person, personIndex) => e('span', { key: personIndex, className: 'nw-tag' }, person.name ?? '')))
              : null,
            scene.pressure_point ? e('p', { className: 'nw-scene-text' }, scene.pressure_point) : null,
          )),
        ) : null,
        castNames.length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('chapter.cast')), e('div', { className: 'nw-tags' }, castNames.map((name, index) => e('span', { key: index, className: 'nw-tag' }, name)))) : null,
        Array.isArray(outline.state_changes) && outline.state_changes.length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('chapter.stateChanges')), e('ul', { className: 'nw-reading-list' }, outline.state_changes.map((change, index) => e('li', { key: index }, `${change.character?.name ?? ''} · ${dimensionLabel(app, change.dimension)} ${operationLabel(change.operation)} ${change.value ?? ''}`)))) : null,
        Array.isArray(outline.foreshadowing_touch) && outline.foreshadowing_touch.length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('chapter.foreshadowing')), e('div', { className: 'nw-tags' }, outline.foreshadowing_touch.map((item, index) => e('span', { key: index, className: 'nw-tag' }, `${item.id ?? ''} ${foreshadowingLabel(item.action)}`)))) : null,
        e(Field, { label: t('chapter.mustKnow'), value: outline.reader_must_know }),
        e(Field, { label: t('chapter.heldBack'), value: outline.held_back }),
        e(Field, { label: t('chapter.endingNote'), value: outline.ending_note || outline.chapter_end }),
        chapter.outlinePath ? e('div', { style: { marginTop: 28 } }, e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', onClick: () => app.onOpenFile(chapter.outlinePath, t('action.inspectRaw')) }, icon('external', 14), t('action.inspectRaw'))) : null,
      )
    }

    /** Chapter review view. */
    function ChapterReviewView({ app, chapter }) {
      const t = app.t
      const review = chapter.review
      if (!review) {
        return e('div', { className: 'nw-empty' },
          e('h2', { className: 'nw-empty-title' }, t('chapter.noReview')),
          e('p', { className: 'nw-empty-body' }, t('chapter.noTextHint')),
        )
      }
      const failed = review.verdict === 'fail'
      return e('div', { className: 'nw-reading' },
        e('h1', { className: 'nw-reading-title' }, `${fill(t('workbench.chapterNo'), { no: chapter.chapter })} · ${t('chapter.review')}`),
        e('div', { className: 'nw-ov-meta' },
          e('span', { className: `nw-tag ${failed ? 'is-warn' : 'is-success'}` }, failed ? t('reviews.fail') : t('reviews.pass')),
          e('span', { className: 'nw-tag' }, fill(t('reviews.issues'), { n: review.issues })),
          review.blockers ? e('span', { className: 'nw-tag is-warn' }, `blockers ${review.blockers}`) : null,
        ),
        review.wordCount ? e('p', { className: 'nw-muted', style: { marginTop: 18 } }, fill(t('workbench.words'), { n: review.wordCount })) : null,
        review.path ? e('div', { style: { marginTop: 24 } }, e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', onClick: () => app.onOpenFile(review.path, t('chapter.review')) }, icon('external', 14), t('action.inspectRaw'))) : null,
      )
    }

    /** Chapter memory view. */
    function ChapterMemoryView({ app, chapter }) {
      const t = app.t
      const record = (app.snapshot?.memoryRecords ?? []).find((item) => item.chapter === chapter.chapter)
      if (!record) {
        return e('div', { className: 'nw-empty' },
          e('h2', { className: 'nw-empty-title' }, t('chapter.noMemory')),
          e('p', { className: 'nw-empty-body' }, t('panel.noMemory')),
        )
      }
      return e('div', { className: 'nw-reading' },
        e('div', { className: 'nw-ov-meta' },
          e('span', { className: `nw-tag ${record.fresh === false ? 'is-warn' : 'is-success'}` }, record.fresh === false ? t('chapter.memoryStale') : t('chapter.memoryFresh')),
          record.word_count ? e('span', { className: 'nw-tag' }, fill(t('workbench.words'), { n: record.word_count })) : null,
        ),
        e('h1', { className: 'nw-reading-title' }, `${fill(t('workbench.chapterNo'), { no: chapter.chapter })} · ${t('chapter.memory')}`),
        record.summary ? e('p', null, record.summary) : null,
        Array.isArray(record.events) && record.events.length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('chapter.events')), e('ul', { className: 'nw-reading-list' }, record.events.map((event, index) => e('li', { key: index }, event.description ?? String(event))))) : null,
        Array.isArray(record.state_changes) && record.state_changes.length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('chapter.stateChanges')), e('ul', { className: 'nw-reading-list' }, record.state_changes.map((change, index) => e('li', { key: index }, `${change.character ?? ''} · ${dimensionLabel(app, change.dimension)} ${operationLabel(change.operation)} ${change.value ?? ''}`)))) : null,
        Array.isArray(record.foreshadowing) && record.foreshadowing.length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('chapter.foreshadowing')), e('ul', { className: 'nw-reading-list' }, record.foreshadowing.map((item, index) => e('li', { key: index }, `${item.id ?? ''} ${foreshadowingLabel(item.action)} ${item.note ?? ''}`)))) : null,
        record.source_revision ? e('p', { className: 'nw-muted', style: { marginTop: 20 } }, `source ${record.source_revision}`) : null,
      )
    }

    /** Character content: profile markdown or folded state. */
    function CharacterView({ app }) {
      const t = app.t
      const character = (app.snapshot?.characters ?? []).find((item) => item.name === app.selection?.name)
      if (!character) return e('div', { className: 'nw-empty' }, e('h2', { className: 'nw-empty-title' }, t('workbench.noContent')))
      if (app.characterView === 'state') {
        const folded = app.snapshot?.characterStates?.[character.name] ?? {}
        const initial = character.identity?.initialStates ?? []
        return e('div', { className: 'nw-reading' },
          e('h1', { className: 'nw-reading-title' }, `${character.name} · ${t('character.state')}`),
          initial.length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('character.initial')), e('dl', null, initial.map((state, index) => e('div', { key: index, className: 'nw-kv' }, e('dt', null, dimensionLabel(app, state.dimension)), e('dd', null, String(state.value ?? '')))))) : null,
          Object.keys(folded).length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('character.current')), e('dl', null, Object.entries(folded).map(([dimension, state], index) => e('div', { key: index, className: 'nw-kv' }, e('dt', null, dimensionLabel(app, dimension)), e('dd', null, `${Array.isArray(state.value) ? state.value.join('、') : state.value}${state.chapter ? ` · ${fill(t('workbench.chapterNo'), { no: state.chapter })}` : ''}`))))) : e('p', { className: 'nw-muted' }, t('panel.noMemory')),
        )
      }
      if (app.fileState === 'loading') return e('div', { className: 'nw-empty' }, e('span', { className: 'nw-spinner' }), t('state.loading'))
      if (app.fileState === 'error') return e('div', { className: 'nw-empty' }, e('h2', { className: 'nw-empty-title' }, t('state.error')), e('p', { className: 'nw-empty-body' }, app.fileError), e('button', { type: 'button', className: 'nw-btn is-secondary', onClick: app.onReload }, t('state.retry')))
      if (app.editing) return e('div', { className: 'nw-editor-wrap' }, e('textarea', { className: 'nw-editor', value: app.draft, spellCheck: false, disabled: app.saving, onChange: (event) => app.onDraft(event.target.value) }))
      if (!app.file) {
        return e('div', { className: 'nw-empty' },
          e('h2', { className: 'nw-empty-title' }, character.name),
          e('p', { className: 'nw-empty-body' }, character.identity?.portrait || t('aside.noIdentity')),
        )
      }
      return e('div', null, e(TruncatedNotice, { app }), e(MarkdownBody, {
        text: app.file.text,
        afterTitle: character.identity?.portrait ? e('p', { className: 'nw-quote' }, character.identity.portrait) : null,
      }))
    }

    /** Structured outline view. */
    function OutlineView({ app }) {
      const t = app.t
      const outline = app.snapshot?.outline
      if (!outline) return e('div', { className: 'nw-empty' }, e('h2', { className: 'nw-empty-title' }, t('outline.empty')), e('p', { className: 'nw-empty-body' }, t('workbench.openFirst')))
      return e('div', { className: 'nw-reading' },
        e('h1', { className: 'nw-reading-title' }, outline.title || t('workbench.outline')),
        outline.synopsis ? e('p', null, outline.synopsis) : null,
        (app.snapshot?.volumes ?? []).length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('outline.volumes')),
          (app.snapshot.volumes ?? []).map((volume) => e('div', { key: volume.volumeNo, className: 'nw-outline-volume' },
            e('h3', null, `${fill(t('workbench.volume'), { no: volume.volumeNo })}${volume.title ? ` · ${volume.title}` : ''}`),
            volume.synopsis ? e('p', { className: 'nw-muted' }, volume.synopsis) : null,
            (volume.arcs ?? []).map((arc) => e('div', { key: arc.arcId, className: 'nw-outline-arc' },
              e('strong', null, arc.title || arc.arcId),
              arc.chapterStart ? e('span', { className: 'nw-muted' }, ` · ${fill(t('workbench.chapterNo'), { no: arc.chapterStart })}–${arc.chapterEnd ?? '?'}`) : null,
              arc.synopsis ? e('p', { className: 'nw-muted' }, arc.synopsis) : null,
            )),
          )),
        ) : null,
        (outline.storylines ?? []).length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('outline.storylines')), e('div', { className: 'nw-tags' }, outline.storylines.map((line, index) => e('span', { key: index, className: 'nw-tag' }, `${line.name ?? line.id ?? ''}${line.type ? ` · ${line.type}` : ''}`)))) : null,
        (outline.mysteries ?? []).length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('outline.mysteries')), e('ul', { className: 'nw-reading-list' }, outline.mysteries.map((mystery, index) => e('li', { key: index }, `${mystery.question ?? ''}${mystery.truth ? ` → ${mystery.truth}` : ''}${mystery.reveal ? `（第 ${mystery.reveal} 章）` : ''}`)))) : null,
        (outline.foreshadowing ?? []).length > 0 ? e('section', { className: 'nw-section' }, e('h2', null, t('outline.foreshadowing')), e('ul', { className: 'nw-reading-list' }, outline.foreshadowing.map((item, index) => e('li', { key: index }, `${item.id ?? ''} ${item.description ?? ''}${item.planted_chapter ? ` · 埋于第 ${item.planted_chapter} 章 → ${item.target_reveal ?? '?'}` : ''}`)))) : null,
      )
    }

    /** Premise cards view. */
    function PremiseView({ app }) {
      const t = app.t
      const premise = app.snapshot?.premise
      if (!premise || premise.cards.length === 0) return e('div', { className: 'nw-empty' }, e('h2', { className: 'nw-empty-title' }, t('premise.empty')))
      return e('div', { className: 'nw-ov' },
        e('section', { className: 'nw-section', style: { marginTop: 0 } },
          e('h2', null, t('workbench.premise')),
          e('div', { className: 'nw-premise-grid' }, premise.cards.map((card, index) => e('div', { key: card.card ?? index, className: 'nw-premise-card' },
            e('h3', null, CARD_LABELS[card.card] ?? String(card.card ?? '')),
            (card.fields ?? []).map((field, fieldIndex) => e('div', { key: fieldIndex, className: 'nw-premise-field' },
              e('div', { className: 'nw-premise-key' }, `${PREMISE_FIELD_LABELS[field.key] ?? String(field.key ?? '')}${field.certainty ? ` · ${t(`premise.certainty.${field.certainty}`)}` : ''}`),
              e('div', { className: 'nw-premise-value' }, String((field.key === 'address' ? (PREMISE_VALUES[field.value] ?? field.value) : field.value) ?? '')),
              field.note ? e('div', { className: 'nw-muted' }, field.note) : null,
            )),
          ))),
        ),
      )
    }

    /** Memory overview. */
    function MemoryView({ app }) {
      const t = app.t
      const records = app.snapshot?.memoryRecords ?? []
      const missing = app.snapshot?.status?.memory?.missing ?? []
      const stale = app.snapshot?.status?.memory?.stale ?? []
      return e('div', { className: 'nw-ov' },
        e('div', { className: 'nw-stats3' },
          e('div', { className: 'nw-bigstat' }, e('b', null, String(records.length)), e('span', null, t('memory.records'))),
          e('div', { className: 'nw-bigstat' }, e('b', null, String(missing.length)), e('span', null, t('memory.missing'))),
          e('div', { className: 'nw-bigstat' }, e('b', null, String(stale.length)), e('span', null, t('memory.stale'))),
        ),
        e('section', { className: 'nw-section', style: { marginTop: 0 } },
          e('h2', null, t('memory.list')),
          records.length === 0 ? e('p', { className: 'nw-muted' }, t('memory.none')) : e('div', { className: 'nw-recent' }, records.map((record) => e('button', {
            key: record.chapter, type: 'button', className: 'nw-memory-row', onClick: () => app.onOpenChapter((app.snapshot.chapters ?? []).find((row) => row.chapter === record.chapter) ?? { chapter: record.chapter }, 'memory'),
          },
            e('span', { className: 'nw-rrow-no' }, fill(t('workbench.chapterNo'), { no: record.chapter })),
            e('span', { className: 'nw-rrow-title' }, record.summary || '—'),
            e('span', { className: `nw-tag ${record.fresh === false ? 'is-warn' : 'is-success'}` }, record.fresh === false ? t('memory.outdated') : t('memory.fresh')),
          ))),
        ),
      )
    }

    /** Reviews overview. */
    function ReviewsView({ app }) {
      const t = app.t
      const reviews = app.snapshot?.reviews ?? []
      if (reviews.length === 0) return e('div', { className: 'nw-empty' },
        e('h2', { className: 'nw-empty-title' }, t('reviews.empty')),
        e('p', { className: 'nw-empty-body' }, t('reviews.emptyBody')),
      )
      return e('div', { className: 'nw-ov' },
        e('section', { className: 'nw-section', style: { marginTop: 0 } },
          e('h2', null, t('workbench.reviews')),
          e('div', { className: 'nw-recent' }, reviews.map((review) => e('button', {
            key: review.chapter, type: 'button', className: 'nw-rrow', onClick: () => app.onOpenChapter((app.snapshot.chapters ?? []).find((row) => row.chapter === review.chapter) ?? { chapter: review.chapter }, 'review'),
          },
            e('span', { className: 'nw-rrow-no' }, fill(t('workbench.chapterNo'), { no: review.chapter })),
            e('span', { className: 'nw-rrow-title' }, review.path ?? ''),
            e('span', { className: `nw-tag ${review.verdict === 'fail' ? 'is-warn' : 'is-success'}` }, review.verdict === 'fail' ? t('reviews.fail') : t('reviews.pass')),
            e('span', { className: 'nw-rrow-words' }, fill(t('reviews.issues'), { n: review.issues })),
          ))),
        ),
      )
    }

    /** Generic text/JSON file view. */
    function FileView({ app }) {
      const t = app.t
      const file = app.file
      const readOnly = isProtectedPath(app.selection?.path)
      if (app.fileState === 'loading') return e('div', { className: 'nw-empty' }, e('span', { className: 'nw-spinner' }), t('state.loading'))
      if (app.fileState === 'error') return e('div', { className: 'nw-empty' }, e('h2', { className: 'nw-empty-title' }, t('state.error')), e('p', { className: 'nw-empty-body' }, app.fileError), e('button', { type: 'button', className: 'nw-btn is-secondary', onClick: app.onReload }, t('state.retry')))
      if (!file) return e('div', { className: 'nw-empty' }, e('h2', { className: 'nw-empty-title' }, t('workbench.noContent')))
      if (app.editing && !readOnly) {
        const mono = /\.(json|ya?ml|csv|tsv)$/i.test(file.path)
        return e('div', { className: 'nw-editor-wrap' }, e('textarea', { className: `nw-editor ${mono ? 'is-mono' : ''}`, value: app.draft, spellCheck: false, disabled: app.saving, onChange: (event) => app.onDraft(event.target.value) }))
      }
      const body = /\.(json|ya?ml|csv|tsv)$/i.test(file.path)
        ? e('div', { className: 'nw-reading' }, e('pre', { className: 'nw-pre' }, file.text))
        : e(MarkdownBody, { text: file.text })
      return e('div', null, e(TruncatedNotice, { app }), body)
    }

    /** One status chip for a tracking row. */
    function trackingTag(t, level, label) {
      const cls = level === 'good' ? 'is-success' : level === 'warn' ? 'is-warn' : ''
      return e('span', { className: `nw-tag ${cls}` }, label)
    }

    /**
     * The four visible memory sheets: progress, summaries, foreshadowing and
     * character states. Read-only projection of the structured memory.
     * @param {{ app: object }} props - page model.
     * @returns {any} the tracking view.
     */
    function TrackingView({ app }) {
      const t = app.t
      const tracking = app.snapshot?.tracking
      if (!tracking) {
        // The toolbar already owns the one refresh action; the empty state
        // explains instead of offering a second copy of it.
        return e('div', { className: 'nw-track' },
          e('div', { className: 'nw-empty' },
            e('h2', { className: 'nw-empty-title' }, t('workbench.tracking')),
            e('p', { className: 'nw-empty-body' }, t('tracking.empty')),
          ),
        )
      }
      const tab = app.trackingTab ?? 'progress'
      if (tab === 'summaries') {
        const groups = new Map()
        for (const row of tracking.summaries ?? []) {
          const key = row.volume === null ? t('workbench.loose') : fill(t('workbench.volume'), { no: row.volume })
          if (!groups.has(key)) groups.set(key, [])
          groups.get(key).push(row)
        }
        return e('div', { className: 'nw-track' },
          e('p', { className: 'nw-track-note' }, t('tracking.generated')),
          groups.size === 0 ? e('div', { className: 'nw-empty' }, e('p', { className: 'nw-empty-body' }, t('tracking.noSummaries'))) : null,
          [...groups.entries()].map(([group, rows]) => e('section', { key: group, className: 'nw-track-section' },
            e('h3', null, group),
            rows.map((row) => e('article', { key: row.chapter, className: 'nw-track-sum' },
              e('header', { className: 'nw-track-sum-head' },
                e('b', null, fill(t('tracking.chapterNo'), { no: row.chapter })),
                e('span', { className: 'nw-track-sum-title' }, row.title),
                e('em', null, fill(t('tracking.wordCount'), { n: row.words })),
                row.missing ? trackingTag(t, 'warn', t('tracking.missing')) : row.stale ? trackingTag(t, 'warn', t('tracking.stale')) : null,
              ),
              e('p', { className: 'nw-track-sum-body' }, row.summary || '—'),
              row.events.length > 0 ? e('ul', { className: 'nw-track-events' }, row.events.map((event, index) => e('li', { key: index }, event))) : null,
            )),
          )),
        )
      }
      if (tab === 'foreshadowing') {
        const open = tracking.openForeshadowing?.length ?? 0
        const overdue = tracking.foreshadowing.filter((item) => item.status === '逾期').length
        return e('div', { className: 'nw-track' },
          e('p', { className: 'nw-track-note' }, `${t('tracking.generated')} · ${t('tracking.open')} ${open} · ${t('tracking.overdue')} ${overdue}`),
          tracking.foreshadowing.length === 0
            ? e('div', { className: 'nw-empty' }, e('p', { className: 'nw-empty-body' }, t('tracking.noForeshadowing')))
            : e('div', { className: 'nw-track-table-wrap' },
              e('table', { className: 'nw-track-table' },
                e('thead', null, e('tr', null,
                  e('th', null, 'ID'), e('th', null, '伏笔'), e('th', null, '埋设'), e('th', null, '计划回收'), e('th', null, '状态'), e('th', null, '最近动作'), e('th', null, '依据章'),
                )),
                e('tbody', null, tracking.foreshadowing.map((item) => e('tr', { key: item.id },
                  e('td', { className: 'nw-track-mono' }, item.id),
                  e('td', null, item.description),
                  e('td', null, item.planted ?? '—'),
                  e('td', null, item.target ?? '—'),
                  e('td', null, trackingTag(t, item.level, item.status)),
                  e('td', null, item.lastActionLabel || '—'),
                  e('td', null, item.lastChapter ?? '—'),
                ))),
              ),
            ),
        )
      }
      if (tab === 'characters') {
        const people = tracking.characters ?? []
        const chapterRows = new Map((app.snapshot?.chapters ?? []).map((row) => [row.chapter, row]))
        return e('div', { className: 'nw-track' },
          e('p', { className: 'nw-track-note' }, t('tracking.generated')),
          people.length === 0 ? e('div', { className: 'nw-empty' }, e('p', { className: 'nw-empty-body' }, t('tracking.noCharacters'))) : null,
          e('div', { className: 'nw-track-people' }, people.map((person) => {
            const characterRow = (app.snapshot?.characters ?? []).find((row) => row.name === person.name)
            return e(characterRow?.path ? 'button' : 'div', {
              key: person.name,
              type: characterRow?.path ? 'button' : undefined,
              className: `nw-track-person ${characterRow?.path ? 'is-link' : ''}`,
              onClick: characterRow?.path ? () => app.onOpenCharacter(characterRow) : undefined,
            },
              e('div', { className: 'nw-track-person-head' },
                e('b', null, person.name),
                e('span', { className: 'nw-tag' }, STAGE_LABELS[person.stage] ?? person.stage ?? '—'),
                e('span', { className: 'nw-spacer' }),
                person.lastChanged ? e('span', { className: 'nw-muted' }, fill(t('tracking.chapterNo'), { no: person.lastChanged })) : null,
              ),
              person.current.length === 0
                ? e('p', { className: 'nw-muted' }, '还没有记过状态变化。')
                : e('div', { className: 'nw-track-states' }, person.current.slice(0, 8).map((state) => e('span', { key: state.dimension, className: 'nw-track-state' },
                  e('em', null, state.label),
                  String(Array.isArray(state.value) ? state.value.join('、') : state.value ?? '空'),
                ))),
              person.recent.length > 0 ? e('div', { className: 'nw-track-recent' },
                e('span', { className: 'nw-muted' }, t('tracking.lastChange')),
                person.recent.slice(0, 3).map((change, index) => e('div', { key: index, className: 'nw-track-change' }, `第 ${change.chapter} 章 · ${change.label} · ${change.value ?? ''}`)),
              ) : null,
            )
          })),
        )
      }
      const progress = tracking.progress
      const action = app.journey?.action ?? null
      const checklist = tracking.checklist ?? []
      return e('div', { className: 'nw-track' },
        e('p', { className: 'nw-track-note' }, t('tracking.generated')),
        e('section', { className: 'nw-track-hero' },
          e('div', { className: 'nw-track-hero-num' }, e('b', null, String(progress.written)), e('span', null, progress.total ? ` / ${progress.total} 章` : ' 章')),
          e('p', null, `${Number(progress.words ?? 0).toLocaleString()} 字 · 下一章 第 ${progress.nextChapter} 章 · 记忆 ${progress.memory.recorded} 章`),
          e('div', { className: 'nw-bar' }, e('i', { style: { width: `${progress.percent}%` } })),
        ),
        e('section', { className: 'nw-track-section' },
          e('h3', null, t('tracking.volumes')),
          (progress.volumes ?? []).length === 0
            ? e('p', { className: 'nw-muted' }, '还没有分卷。')
            : progress.volumes.map((volume) => e('div', { key: volume.title, className: 'nw-track-vol' },
              e('span', null, volume.title),
              e('b', null, `${volume.written}/${volume.total}`),
              e('div', { className: 'nw-bar' }, e('i', { style: { width: `${volume.percent}%` } })),
            )),
        ),
        e('section', { className: 'nw-track-section' },
          e('h3', null, t('tracking.next')),
          e('p', { className: 'nw-track-next' }, progress.nextStep || '继续写下一章'),
          progress.nextDescription ? e('p', { className: 'nw-muted' }, progress.nextDescription) : null,
          action ? e('button', { type: 'button', className: 'nw-btn is-primary is-sm', onClick: () => app.onJourney(action) }, action.label) : null,
        ),
        e('section', { className: 'nw-track-section' },
          e('h3', null, t('tracking.issues')),
          checklist.length === 0
            ? e('p', { className: 'nw-muted' }, t('journey.healthGood'))
            : checklist.filter((item) => item.level !== 'good').map((item) => e('div', { key: item.id, className: 'nw-track-issue' },
              e('i', { className: `nw-health-dot is-${item.level}` }),
              e('span', null, item.label),
              item.detail ? e('em', null, item.detail) : null,
            )),
        ),
        e('section', { className: 'nw-track-section' },
          e('h3', null, t('tracking.recent')),
          (tracking.summaries ?? []).slice(-6).reverse().map((row) => e('div', { key: row.chapter, className: 'nw-track-recent-row' },
            e('span', { className: 'nw-track-mono' }, fill(t('tracking.chapterNo'), { no: row.chapter })),
            e('span', { className: 'nw-track-recent-title' }, row.title),
            e('span', { className: 'nw-muted' }, fill(t('tracking.wordCount'), { n: row.words })),
            row.missing ? trackingTag(t, 'warn', t('tracking.missing')) : row.stale ? trackingTag(t, 'warn', t('tracking.stale')) : null,
          )),
        ),
      )
    }

    /**
     * Route the current selection to its content view.
     * @param {{ app: object }} props - page model.
     * @returns {any} the view.
     */
    function ContentView({ app }) {
      if (!app.selection) return e(OverviewView, { app })
      switch (app.selection.kind) {
        case 'chapter': return e(ChapterView, { app })
        case 'character': return e(CharacterView, { app })
        case 'outline': return e(OutlineView, { app })
        case 'premise': return e(PremiseView, { app })
        case 'memory': return e(MemoryView, { app })
        case 'reviews': return e(ReviewsView, { app })
        case 'tracking': return e(TrackingView, { app })
        case 'world':
        case 'file': return e(FileView, { app })
        default: return e(OverviewView, { app })
      }
    }

// ---- 80-panel.js ----
    /** One titled panel section. */
    function PanelSection({ title, children }) {
      if (!children) return null
      return e('section', { className: 'nw-sec' }, e('h4', null, title), children)
    }

    /** One label/value row. */
    function PanelKv({ label, value }) {
      if (value === null || value === undefined || value === '') return null
      return e('div', { className: 'nw-kv' }, e('dt', null, label), e('dd', null, value))
    }

    /**
     * Right context panel. In a Session view it also hosts the live transcript.
     * @param {{ app: object }} props - page model.
     * @returns {any} the panel.
     */
    function ContextPanel({ app }) {
      const t = app.t
      const isChat = app.isSession && app.panelTab === 'chat'
      const selection = app.selection
      const snapshot = app.snapshot
      const title = !selection
        ? t('panel.book')
        : selection.kind === 'chapter'
          ? t('panel.chapter')
          : selection.kind === 'character'
            ? t('panel.character')
            : selection.kind === 'world' || selection.kind === 'file'
              ? t('panel.file')
              : selection.kind === 'outline'
                ? t('workbench.outline')
                : selection.kind === 'premise'
                  ? t('workbench.premise')
                  : selection.kind === 'memory'
                    ? t('workbench.memory')
                    : selection.kind === 'tracking'
                      ? t('workbench.tracking')
                      : t('workbench.reviews')

      const sections = []
      if (!selection) {
        const status = app.status
        sections.push(e(PanelSection, { key: 'book', title: t('workbench.book') },
          e('dl', null,
            e(PanelKv, { label: t('aside.title'), value: app.book?.title }),
            e(PanelKv, { label: t('aside.genre'), value: app.book?.genre || '—' }),
            e(PanelKv, { label: t('aside.stage'), value: `${status?.writtenChapters ?? 0} / ${app.book?.totalChapters ?? '?'}` }),
            e(PanelKv, { label: t('aside.words'), value: (status?.totalWords ?? 0).toLocaleString() }),
            e(PanelKv, { label: t('aside.next'), value: status?.nextChapter ? fill(t('workbench.chapterNo'), { no: status.nextChapter }) : '—' }),
            e(PanelKv, { label: t('aside.memory'), value: `${snapshot?.book?.memory?.records ?? 0} 章` }),
            e(PanelKv, { label: t('aside.updated'), value: formatTime(app.book?.updatedAt, app.t) }),
          ),
        ),)
        sections.push(e(PanelSection, { key: 'path', title: t('panel.path') },
          e('div', { className: 'nw-muted', style: { fontSize: 11, wordBreak: 'break-all' } }, app.book?.dir ?? ''),
        ))
      } else if (selection.kind === 'chapter') {
        const chapter = (snapshot?.chapters ?? []).find((row) => row.chapter === selection.chapter)
        const outline = snapshot?.chapterOutlines?.[String(selection.chapter)]?.data
        const record = (snapshot?.memoryRecords ?? []).find((row) => row.chapter === selection.chapter)
        sections.push(e(PanelSection, { key: 'chapter', title: t('panel.chapter') },
          e('dl', null,
            e(PanelKv, { label: t('aside.words'), value: `${chapter?.words ?? 0}${app.book?.wordsPerChapter ? ` / ${app.book.wordsPerChapter}` : ''}` }),
            e(PanelKv, { label: t('chapter.volume'), value: chapter?.volume === null || chapter?.volume === undefined ? '—' : String(chapter.volume) }),
            e(PanelKv, { label: t('chapter.review'), value: chapter?.review ? (chapter.review.verdict === 'fail' ? fill(t('chapter.reviewFail'), { n: chapter.review.blockers || chapter.review.issues }) : t('chapter.reviewPass')) : t('chapter.reviewNone') }),
            e(PanelKv, { label: t('chapter.memory'), value: chapter?.hasMemory ? (chapter.memoryFresh === false ? t('memory.outdated') : t('memory.fresh')) : t('chapter.noMemory') }),
            e(PanelKv, { label: t('panel.path'), value: e('span', { style: { fontSize: 10, color: 'var(--nw-text-3)' } }, chapter?.path ?? '—') }),
          ),
        ))
        if (outline) {
          const beatItems = Array.isArray(outline.beats)
            ? outline.beats
            : Array.isArray(outline.scenes)
              ? outline.scenes.map((scene) => `${scene.location ?? ''}${scene.pressure_point ? ` · ${scene.pressure_point}` : ''}`)
              : []
          const castNames = Array.from(new Set([
            ...(outline.pov_character?.name ? [outline.pov_character.name] : []),
            ...(Array.isArray(outline.characters) ? outline.characters.map((person) => person.name) : []),
            ...(Array.isArray(outline.scenes) ? outline.scenes.flatMap((scene) => (Array.isArray(scene.characters) ? scene.characters.map((person) => person.name) : [])) : []),
          ].filter(Boolean)))
          sections.push(e(PanelSection, { key: 'outline', title: t('chapter.outlineGist') },
            beatItems.length > 0
              ? e('ul', { className: 'nw-beats' }, beatItems.map((beat, index) => e('li', { key: index }, beat)))
              : e('div', { className: 'nw-muted' }, '—'),
            castNames.length > 0 ? e('div', { className: 'nw-tags', style: { marginTop: 10 } }, castNames.map((name, index) => e('span', { key: index, className: 'nw-tag' }, name))) : null,
            Array.isArray(outline.state_changes) && outline.state_changes.length > 0 ? e('ul', { className: 'nw-beats', style: { marginTop: 10 } }, outline.state_changes.map((change, index) => e('li', { key: index }, `${change.character?.name ?? ''} · ${dimensionLabel(app, change.dimension)} ${operationLabel(change.operation)} ${change.value ?? ''}`))) : null,
            Array.isArray(outline.foreshadowing_touch) && outline.foreshadowing_touch.length > 0 ? e('div', { className: 'nw-tags', style: { marginTop: 10 } }, outline.foreshadowing_touch.map((item, index) => e('span', { key: index, className: 'nw-tag' }, `${item.id ?? ''} ${foreshadowingLabel(item.action)}`))) : null,
          ))
        }
        sections.push(e(PanelSection, { key: 'memory', title: t('chapter.memory') },
          record
            ? [
              e('div', { key: 'tag', className: 'nw-tags', style: { marginBottom: 8 } }, e('span', { className: `nw-tag ${record.fresh === false ? 'is-warn' : 'is-success'}` }, record.fresh === false ? t('memory.outdated') : t('memory.fresh'))),
              e('div', { key: 'summary', className: 'nw-muted' }, record.summary || '—'),
            ]
            : e('div', { className: 'nw-muted' }, t('panel.noMemory')),
        ))
      } else if (selection.kind === 'character') {
        const character = (snapshot?.characters ?? []).find((item) => item.name === selection.name)
        const identity = character?.identity ?? null
        const folded = snapshot?.characterStates?.[selection.name] ?? {}
        sections.push(e(PanelSection, { key: 'character', title: t('panel.character') },
          e('dl', null,
            e(PanelKv, { label: t('character.stage'), value: STAGE_LABELS[identity?.profileStage] ?? identity?.profileStage ?? '—' }),
            e(PanelKv, { label: t('character.aliases'), value: identity?.aliases?.length ? identity.aliases.join('、') : '—' }),
            e(PanelKv, { label: t('character.gender'), value: identity?.gender || '—' }),
            e(PanelKv, { label: t('character.age'), value: identity?.age || '—' }),
            e(PanelKv, { label: t('character.identity'), value: e('span', { style: { fontSize: 10, color: 'var(--nw-text-3)' } }, identity?.path ?? '—') }),
          ),
        ))
        if (identity?.portrait) sections.push(e(PanelSection, { key: 'portrait', title: t('character.portrait') }, e('div', { className: 'nw-muted' }, identity.portrait)))
        if (Object.keys(folded).length > 0) {
          sections.push(e(PanelSection, { key: 'state', title: t('character.current') },
            e('dl', null, Object.entries(folded).map(([dimension, state], index) => e(PanelKv, {
              key: index,
              label: dimension,
              value: `${Array.isArray(state.value) ? state.value.join('、') : state.value}${state.chapter ? ` · ${fill(t('workbench.chapterNo'), { no: state.chapter })}` : ''}`,
            }))),
          ))
        }
      } else if (selection.kind === 'outline') {
        sections.push(e(PanelSection, { key: 'outline', title: t('workbench.outline') },
          e('dl', null,
            e(PanelKv, { label: t('outline.volumes'), value: String((snapshot?.volumes ?? []).length) }),
            e(PanelKv, { label: t('outline.storylines'), value: String((snapshot?.outline?.storylines ?? []).length) }),
            e(PanelKv, { label: t('outline.mysteries'), value: String((snapshot?.outline?.mysteries ?? []).length) }),
            e(PanelKv, { label: t('outline.foreshadowing'), value: String((snapshot?.outline?.foreshadowing ?? []).length) }),
            e(PanelKv, { label: t('panel.path'), value: e('span', { style: { fontSize: 10, color: 'var(--nw-text-3)' } }, snapshot?.outline?.path ?? '—') }),
          ),
        ))
      } else if (selection.kind === 'premise') {
        sections.push(e(PanelSection, { key: 'premise', title: t('workbench.premise') },
          e('dl', null,
            e(PanelKv, { label: t('workbench.premise'), value: String(snapshot?.premise?.cards?.length ?? 0) }),
            e(PanelKv, { label: t('panel.path'), value: e('span', { style: { fontSize: 10, color: 'var(--nw-text-3)' } }, snapshot?.premise?.path ?? '—') }),
          ),
        ))
      } else if (selection.kind === 'memory') {
        const memory = snapshot?.book?.memory ?? {}
        sections.push(e(PanelSection, { key: 'memory', title: t('workbench.memory') },
          e('dl', null,
            e(PanelKv, { label: t('memory.records'), value: String(memory.records ?? 0) }),
            e(PanelKv, { label: t('memory.missing'), value: String(snapshot?.status?.memory?.missing?.length ?? 0) }),
            e(PanelKv, { label: t('memory.stale'), value: String(snapshot?.status?.memory?.stale?.length ?? 0) }),
            e(PanelKv, { label: t('memory.db'), value: memory.dbBytes === null || memory.dbBytes === undefined ? t('memory.none') : formatBytes(memory.dbBytes) }),
          ),
        ))
      } else if (selection.kind === 'reviews') {
        const reviews = snapshot?.reviews ?? []
        sections.push(e(PanelSection, { key: 'reviews', title: t('workbench.reviews') },
          e('dl', null,
            e(PanelKv, { label: t('workbench.reviews'), value: String(reviews.length) }),
            e(PanelKv, { label: t('reviews.fail'), value: String(reviews.filter((review) => review.verdict === 'fail').length) }),
          ),
        ))
      } else if (selection.kind === 'world' || selection.kind === 'file') {
        sections.push(e(PanelSection, { key: 'file', title: t('panel.file') },
          e('dl', null,
            e(PanelKv, { label: t('panel.path'), value: e('span', { style: { fontSize: 10, color: 'var(--nw-text-3)' } }, selection.path ?? '—') }),
            e(PanelKv, { label: t('panel.size'), value: app.file ? formatBytes(app.file.size) : '—' }),
            isProtectedPath(selection.path) ? e(PanelKv, { label: t('workbench.readonly'), value: '✓' }) : null,
          ),
        ))
      }

      return e('aside', { className: `nw-panel ${app.panelOpen ? 'is-open' : ''}` },
        e('div', { className: 'nw-panel-head' },
          app.isSession
            ? e('div', { className: 'nw-panel-tabs' },
              e('button', { type: 'button', className: `nw-panel-tab ${app.panelTab === 'context' ? 'is-active' : ''}`, onClick: () => app.onPanelTab('context') }, t('panel.sections')),
              e('button', { type: 'button', className: `nw-panel-tab ${app.panelTab === 'chat' ? 'is-active' : ''}`, onClick: () => app.onPanelTab('chat') }, t('workbench.chat')),
            )
            : e('div', { className: 'nw-panel-title' }, title),
          e('div', { className: 'nw-spacer' }),
          e(IconButton, { glyph: 'close', label: t('workbench.close'), tipAlign: 'end', onClick: app.onTogglePanel }),
        ),
        isChat ? e(ChatBoard, { app }) : e('div', { className: 'nw-panel-body' }, sections),
      )
    }

    /**
     * Live Session transcript for the Session view. The host composer below the
     * view remains the only input.
     * @param {{ app: object }} props - page model with useChat.
     * @returns {any} the transcript.
     */
    function ChatBoard({ app }) {
      const t = app.t
      const useChat = app.useChat ?? (() => [])
      const nodes = useChat((snapshot) => snapshot?.legacy?.nodes ?? [])
      const partial = useChat((snapshot) => snapshot?.legacy?.partial ?? null)
      const running = useChat((snapshot) => snapshot?.legacy?.runningCalls ?? [])
      const scroller = useRef(null)
      useEffect(() => {
        const element = scroller.current
        if (element) element.scrollTop = element.scrollHeight
      }, [nodes, partial, running])
      const textOf = (blocks) => (Array.isArray(blocks) ? blocks : [])
        .map((block) => (block?.type === 'text' ? String(block.text ?? '') : ''))
        .filter(Boolean)
        .join('\n')
      const rows = []
      for (const node of (Array.isArray(nodes) ? nodes : []).slice(-200)) {
        if (node?.kind === 'user') rows.push({ key: `u${node.seq}`, role: t('chat.you'), tone: 'is-user', text: textOf(node.content) })
        else if (node?.kind === 'assistant') {
          const parts = []
          for (const block of Array.isArray(node.blocks) ? node.blocks : []) {
            if (block?.kind === 'text') parts.push(String(block.text ?? ''))
            else if (block?.kind === 'tool-call') parts.push(`〔${t('chat.tool')}: ${block.name ?? ''}〕`)
          }
          const text = parts.filter(Boolean).join('\n')
          if (text) rows.push({ key: `a${node.seq}`, role: t('chat.agent'), tone: '', text })
        } else if (node?.kind === 'tool-call') {
          const name = node?.data?.root?.name
          if (name) rows.push({ key: `t${node.seq}`, role: t('chat.tool'), tone: 'is-tool', text: String(name) })
        } else if (node?.kind === 'steering') {
          const text = textOf(node.content)
          if (text) rows.push({ key: `s${node.seq}`, role: t('chat.you'), tone: 'is-user', text })
        }
      }
      const partialText = (Array.isArray(partial?.blocks) ? partial.blocks : [])
        .filter((block) => block?.kind === 'text')
        .map((block) => String(block.text ?? ''))
        .join('')
      const runningNames = (Array.isArray(running) ? running : []).map((call) => call?.name).filter(Boolean)
      return e('div', { className: 'nw-chat' },
        e('div', { className: 'nw-chat-scroll', ref: scroller },
          rows.length === 0 && !partialText && runningNames.length === 0
            ? e('div', { className: 'nw-chat-empty' }, t('chat.empty'))
            : rows.map((row) => e('div', { key: row.key, className: `nw-chat-row ${row.tone}` },
              e('div', { className: 'nw-chat-role' }, row.role),
              e('div', { className: 'nw-chat-text' }, row.text),
            )),
          partialText ? e('div', { className: 'nw-chat-row' },
            e('div', { className: 'nw-chat-role' }, `${t('chat.agent')} · ${t('chat.streaming')}`),
            e('div', { className: 'nw-chat-text' }, partialText),
          ) : null,
          runningNames.length > 0 ? e('div', { className: 'nw-chat-row is-tool' },
            e('div', { className: 'nw-chat-role' }, t('chat.tool')),
            e('div', { className: 'nw-chat-text' }, `${t('chat.running')}: ${runningNames.join('、')}`),
          ) : null,
        ),
        e('div', { className: 'nw-chat-hint' }, t('chat.hint')),
      )
    }

    // ---- right-sidebar novel panel -----------------------------------------
    // A stage-aware "book cockpit": every stage answers what exists, what is
    // missing, and what the author can do next, without assuming any chapter is
    // written yet. It is designed for a narrow, resizable column.

    /** Stage names, in the panel's more concrete wording. */
    const PANEL_STAGE_KEYS = {
      setup: 'panel.stage.setup',
      outline: 'panel.stage.outline',
      prepare: 'panel.stage.prepare',
      writing: 'panel.stage.writing',
      done: 'panel.stage.done',
    }
    const PANEL_STEP_KEYS = ['panel.step.setup', 'panel.step.outline', 'panel.step.writing', 'panel.step.done']
    /** The four premise cards worth checking first. */
    const PREMISE_CORE = ['core_hook', 'central_dramatic_question', 'protagonist_desire', 'antagonistic_force']
    /** All nine premise cards, in a reading order for the checklist. */
    const PREMISE_ORDER = [
      'genre_contract', 'core_hook', 'golden_finger', 'protagonist_desire', 'antagonistic_force',
      'central_dramatic_question', 'world_rules', 'narrator_voice', 'blank_declaration',
    ]

    /** Which board the book is on. `prepare` is outline-ready but text-less. */
    function panelStage(snapshot) {
      const journey = snapshot?.journey
      if (!journey) return 'setup'
      if (journey.stage === 'setup' || journey.stage === 'outline' || journey.stage === 'done') return journey.stage
      if ((snapshot?.status?.writtenChapters ?? 0) === 0) return 'prepare'
      return 'writing'
    }

    /** Localized copy with a Chinese fallback for keys a build may not have. */
    function panelCopy(t, key, fallback) {
      const value = t(key)
      return value === key ? fallback : value
    }

    /** Display name for one premise card. */
    function premiseCardLabel(t, id) {
      return panelCopy(t, `premise.card.${id}`, CARD_LABELS[id] ?? id)
    }

    /** One field's text from one premise card. */
    function premiseField(cards, cardId, fieldKey) {
      const card = (Array.isArray(cards) ? cards : []).find((row) => row?.card === cardId)
      const field = (Array.isArray(card?.fields) ? card.fields : []).find((row) => row?.key === fieldKey)
      return String(field?.value ?? '').trim()
    }

    /** The first non-empty value of one premise card. */
    function premiseCardValue(cards, cardId) {
      const card = (Array.isArray(cards) ? cards : []).find((row) => row?.card === cardId)
      const field = (Array.isArray(card?.fields) ? card.fields : []).find((row) => String(row?.value ?? '').trim().length > 0)
      return field ? String(field.value).trim() : ''
    }

    /** Whether a premise card has any content. */
    function premiseCardFilled(cards, cardId) {
      return premiseCardValue(cards, cardId).length > 0
    }

    /** A compact signature of the snapshot, for fallback change detection. */
    function panelSnapshotSignature(snapshot) {
      return JSON.stringify({
        stamp: snapshot?.stamp ?? '',
        updatedAt: snapshot?.book?.updatedAt ?? 0,
        status: snapshot?.status ?? null,
        chapters: (snapshot?.chapters ?? []).map((row) => [row.chapter, row.mtime, row.words, row.hasText, row.hasOutline, row.review?.verdict ?? '']),
        premise: snapshot?.premise?.cards ?? null,
        outline: snapshot?.outline
          ? [snapshot.outline.title, snapshot.outline.synopsis, snapshot.outline.storylines?.length ?? 0,
            snapshot.outline.raw?.volumes?.length ?? 0, snapshot.outline.raw?.volume_plan?.length ?? 0,
            snapshot.outline.mysteries?.length ?? 0, snapshot.outline.foreshadowing?.length ?? 0]
          : null,
        characters: (snapshot?.characters ?? []).map((row) => [row.name, row.identity?.profileStage ?? '']),
        world: (snapshot?.settings?.world ?? []).map((row) => row.name),
        reviews: (snapshot?.reviews ?? []).map((row) => [row.chapter, row.verdict]),
      })
    }

    /** A calm HH:MM label for the live sync line. */
    function panelClock(time) {
      if (!time) return ''
      const date = new Date(time)
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }

    /** One section in the panel's scrolling board. */
    function P2Sec(props) {
      return e('section', { className: 'nw-section' },
        e('div', { className: 'nw-sec-head' },
          e('h2', null, props.title),
          props.extra ?? null,
        ),
        props.children,
      )
    }

    /** Small "open in the full workbench" link. */
    function P2Link({ label, onClick }) {
      return e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', onClick },
        e('span', null, label), icon('chevronRight', 13),
      )
    }

    /** Four compact book facts. */
    function P2Stats({ rows }) {
      return e('div', { className: 'nw-stats3 nw-p2-stats' }, rows.map((row) => e('button', {
        key: row.key,
        type: 'button',
        className: 'nw-bigstat',
        onClick: row.onClick,
        disabled: typeof row.onClick !== 'function',
        title: row.title ?? row.label,
      },
        e('b', null, String(row.value)),
        e('span', null, row.label),
      )))
    }

    /** The four journey steps, with the current one highlighted. */
    function P2Steps({ t, index }) {
      return e('div', { className: 'nw-jsteps nw-p2-steps', 'aria-label': t('journey.next') },
        PANEL_STEP_KEYS.map((key, step) => e('div', {
          key,
          className: `nw-jstep nw-p2-step ${step < index ? 'is-done' : step === index ? 'is-active' : ''}`,
        },
          e('i', { className: 'nw-jstep-dot' }),
          e('span', { className: 'nw-p2-step-label' }, t(key)),
          step < PANEL_STEP_KEYS.length - 1 ? e('i', { className: 'nw-jstep-line' }) : null,
        )),
      )
    }

    /** A checked/unchecked row used by the setup, prepare and done boards. */
    function P2CheckRow({ done, label, detail, onClick, content, tone, static: isStatic }) {
      const toneClass = tone ?? (done ? 'is-done' : 'is-idle')
      const Tag = isStatic ? 'div' : 'button'
      return e(Tag, {
        type: isStatic ? undefined : 'button',
        className: `nw-check-row nw-p2-checkrow ${toneClass} ${content ? 'is-content' : ''} ${isStatic ? 'is-static' : ''}`,
        onClick: isStatic ? undefined : onClick,
      },
        e('i', { className: `nw-dot ${toneClass}` }),
        e('b', { className: 'nw-p2-checkrow-label' }, label),
        detail ? e('span', { className: 'nw-p2-checkrow-detail' }, detail) : null,
      )
    }

    /** One chapter row in the recent list. */
    function P2ChapterRow({ t, row, active, onClick }) {
      const tone = row.hasText ? (row.review?.verdict === 'fail' ? 'is-warn' : 'is-done') : row.hasOutline ? 'is-plan' : 'is-idle'
      return e('button', {
        type: 'button',
        className: `nw-rrow nw-p2-chrow ${active ? 'is-active' : ''}`,
        onClick,
        title: row.title,
      },
        e('span', { className: 'nw-rrow-no' }, fill(t('chapter'), { no: row.chapter })),
        e('span', { className: 'nw-rrow-title' }, row.title || ''),
        e('span', { className: 'nw-rrow-words' }, row.hasText
          ? fill(t('chapter.words'), { n: (row.words ?? 0).toLocaleString() })
          : row.hasOutline ? t('panel.hasOutline') : ''),
        e('i', { className: `nw-dot ${tone}` }),
      )
    }

    /** Header: identity, stage, progress, sync state and tools. */
    function P2Header(props) {
      const t = props.t
      return e('header', { className: 'nw-p2-head' },
        e('div', { className: 'nw-p2-head-inner' },
        props.book ? e('div', { className: 'nw-ov-cover nw-p2-cover' }, e(CoverArt, { book: props.book })) : null,
        e('div', { className: 'nw-ov-main nw-p2-id' },
          e('div', { className: 'nw-p2-titlerow' },
            e('h1', { className: 'nw-ov-title nw-p2-title', title: props.book?.title ?? '' }, props.book?.title ?? t('panel.tabTitle')),
            props.stageLabel ? e('span', {
              className: `nw-tag ${props.stage === 'writing' || props.stage === 'done' || props.stage === 'prepare' ? 'is-success' : 'is-plain'}`,
            }, props.stageLabel) : null,
          ),
          e('div', { className: 'nw-ov-meta nw-p2-meta' },
            props.meta.map((part, index) => e('span', { key: index }, part)),
            props.busy
              ? e('span', { className: 'nw-p2-live is-busy' }, e('i', { className: 'nw-p2-pulse' }), props.waiting ? t('panel.waitingShort') : t('panel.busyShort'))
              : props.flash
                ? e('span', { className: 'nw-p2-live is-fresh' }, e('i', { className: 'nw-p2-dot is-done' }), t('panel.updatedFlash'))
                : props.updatedAt
                  ? e('span', { className: 'nw-p2-synced' }, fill(t('panel.synced'), { time: panelClock(props.updatedAt) }))
                  : null,
          ),
          e(P2Steps, { t, index: props.stepIndex }),
        ),
        e('div', { className: 'nw-p2-tools' },
          e(IconButton, {
            glyph: 'refresh',
            label: t('panel.refreshHint'),
            className: props.refreshing ? 'is-spinning' : '',
            disabled: props.refreshing,
            onClick: props.onRefresh,
          }),
          e(IconButton, { glyph: 'external', label: t('panel.openBoard'), tipAlign: 'end', onClick: props.onOpenFull }),
        ),
        ),
      )
    }

    /** The one next step, always visible at the top of the board. */
    function P2Next(props) {
      const t = props.t
      const action = props.action
      if (!action) return null
      const isExport = action.kind === 'export'
      const disabled = props.busy || props.waiting
      const secondary = props.secondary
      return e('section', { className: 'nw-journey nw-p2-next' },
        e('div', { className: 'nw-journey-kicker' }, `${t('panel.nextStep')} · ${props.stageLabel}`),
        e('h2', { className: 'nw-journey-title' }, action.title),
        e('p', { className: 'nw-journey-desc' }, action.description),
        e('div', { className: 'nw-journey-actions' },
          e('button', {
            type: 'button',
            className: 'nw-btn is-primary is-sm',
            disabled,
            onClick: isExport ? props.onExport : () => props.onPrompt(action.prompt ?? t('panel.askNext')),
          }, icon(isExport ? 'external' : 'spark', 14), props.waiting ? t('panel.waitingShort') : action.label),
          secondary ? e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', onClick: secondary.onClick }, secondary.label) : null,
        ),
        props.waiting
          ? e('div', { className: 'nw-journey-hints' }, e('div', { className: 'nw-journey-hint is-waiting' }, t('panel.waiting')))
          : props.busy
            ? e('div', { className: 'nw-journey-hints' }, e('div', { className: 'nw-journey-hint' }, e('i', { className: 'nw-p2-pulse' }), t('panel.busy')))
            : null,
      )
    }

    /** The board for a book that has not finished its premise cards. */
    function panelSetup(app) {
      const t = app.t
      const cards = app.snapshot?.premise?.cards ?? []
      const filled = PREMISE_ORDER.filter((id) => premiseCardFilled(cards, id))
      const missing = PREMISE_ORDER.filter((id) => !premiseCardFilled(cards, id))
      const genre = premiseField(cards, 'genre_contract', 'subgenre')
      const tone = premiseField(cards, 'genre_contract', 'emotional_tone')
      const core = PREMISE_CORE.map((id) => ({
        id,
        label: premiseCardLabel(t, id),
        value: premiseCardValue(cards, id),
        done: filled.includes(id),
      }))
      const main = [
        e(P2Sec, {
          key: 'premise',
          title: t('panel.setup.title'),
          extra: e(P2Link, { label: t('panel.openSection'), onClick: () => app.openFull({ kind: 'premise' }) }),
        },
          e('div', { className: 'nw-progress' },
            e('div', { className: 'nw-bar' }, e('i', { style: { width: `${Math.round((filled.length / PREMISE_ORDER.length) * 100)}%` } })),
            e('div', { className: 'nw-progress-labels' },
              e('span', null, fill(t('panel.setup.progress'), { done: filled.length, total: PREMISE_ORDER.length })),
              e('span', null, t('panel.setup.phase')),
            ),
          ),
          e('div', { className: 'nw-p2-crows' }, core.map((row) => e(P2CheckRow, {
            key: row.id,
            done: row.done,
            content: true,
            label: row.label,
            detail: row.done ? row.value : t('panel.setup.notSet'),
            onClick: () => app.openFull({ kind: 'premise' }),
          }))),
          missing.length > 0
            ? e('p', { className: 'nw-p2-hint' }, fill(t('panel.setup.missing'), {
              list: missing.slice(0, 3).map((id) => premiseCardLabel(t, id)).join('、') + (missing.length > 3 ? ` ${fill(t('panel.more'), { n: missing.length - 3 })}` : ''),
            }))
            : e('p', { className: 'nw-p2-hint is-good' }, t('panel.setup.ready')),
          e('p', { className: 'nw-p2-note' }, t('panel.setup.hint')),
        ),
      ]
      const aside = []
      if (genre || tone) {
        aside.push(e(P2Sec, { key: 'contract', title: t('panel.setup.contract') },
          genre ? e('p', { className: 'nw-p2-quote' }, genre) : null,
          tone ? e('p', { className: 'nw-p2-note' }, tone) : null,
        ))
      }
      aside.push(e(P2Sec, { key: 'stats', title: t('panel.statsTitle') }, e(P2Stats, { rows: panelStats(app) })))
      return { main, aside }
    }

    /** The board for a book with a premise but no outline yet. */
    function panelOutline(app) {
      const t = app.t
      const outline = app.snapshot?.outline
      const volumes = app.snapshot?.volumes ?? []
      const storylines = outline?.storylines ?? []
      const mysteries = outline?.mysteries ?? []
      const foreshadowing = outline?.foreshadowing ?? []
      const cards = app.snapshot?.premise?.cards ?? []
      const filled = PREMISE_ORDER.filter((id) => premiseCardFilled(cards, id))
      const main = [
        e(P2Sec, {
          key: 'outline',
          title: t('panel.outline.title'),
          extra: e(P2Link, { label: t('panel.openSection'), onClick: () => app.openFull({ kind: 'outline' }) }),
        },
          e('p', { className: `nw-p2-synopsis ${outline?.synopsis ? '' : 'is-empty'}` }, outline?.synopsis || t('panel.outline.noSynopsis')),
          e('div', { className: 'nw-p2-facts' },
            e('span', null, `${t('panel.outline.volumes')} ${volumes.length}`),
            e('span', null, `${t('panel.outline.storylines')} ${storylines.length}`),
            e('span', null, `${t('panel.outline.mysteries')} ${mysteries.length}`),
            e('span', null, `${t('panel.outline.foreshadowing')} ${foreshadowing.length}`),
          ),
          volumes.length > 0
            ? volumes.slice(0, 4).map((volume) => e('div', { key: volume.volumeNo, className: 'nw-outline-volume' },
              e('h3', null, volume.title || fill(t('workbench.volume'), { no: volume.volumeNo })),
              volume.chapterStart
                ? e('div', { className: 'nw-muted' }, `${volume.chapterStart}–${volume.chapterEnd ?? '?'}`)
                : null,
              volume.synopsis ? e('p', { className: 'nw-muted' }, volume.synopsis) : null,
            ))
            : e('p', { className: 'nw-muted' }, t('panel.outline.noVolume')),
          filled.length < 5
            ? e('p', { className: 'nw-p2-hint' }, fill(t('panel.outline.premisePartial'), { done: filled.length, total: PREMISE_ORDER.length }))
            : null,
        ),
      ]
      const chapterRows = [1, 2, 3].map((chapter) => {
        const data = app.snapshot?.chapterOutlines?.[String(chapter)]?.data
        return e(P2CheckRow, {
          key: chapter,
          done: Boolean(data),
          label: fill(t('panel.outline.chapterN'), { no: chapter }),
          detail: data ? (data.title || t('panel.ready')) : t('panel.missing'),
          onClick: () => app.openFull({ kind: 'chapter', chapter, view: 'outline' }),
        })
      })
      const aside = [
        e(P2Sec, {
          key: 'chapters',
          title: t('panel.outline.chapterOutlines'),
          extra: e(P2Link, { label: t('panel.outline.allChapters'), onClick: () => app.openFull({ kind: 'manuscript' }) }),
        },
          e('div', { className: 'nw-p2-crows' }, chapterRows),
          e('p', { className: 'nw-p2-note' }, fill(t('panel.outline.chapterCount'), { n: Object.keys(app.snapshot?.chapterOutlines ?? {}).length })),
        ),
        e(P2Sec, { key: 'stats', title: t('panel.statsTitle') }, e(P2Stats, { rows: panelStats(app) })),
      ]
      return { main, aside }
    }

    /** The board for an outline-ready book that has not written chapter one. */
    function panelPrepare(app) {
      const t = app.t
      const snapshot = app.snapshot
      const chapters = snapshot?.chapters ?? []
      const characters = snapshot?.characters ?? []
      const world = snapshot?.settings?.world ?? []
      const firstOutline = snapshot?.chapterOutlines?.['1']?.data ?? null
      const beats = Array.isArray(firstOutline?.beats) ? firstOutline.beats : []
      const checks = [
        { key: 'outline', done: Boolean(snapshot?.outline), label: t('panel.prepare.outline'), detail: snapshot?.outline ? t('panel.ready') : t('panel.missing') },
        { key: 'chapter', done: Boolean(firstOutline), label: fill(t('panel.prepare.chapterOutline'), { no: 1 }), detail: firstOutline ? t('panel.ready') : t('panel.missing') },
        { key: 'cast', done: characters.length > 0, label: fill(t('panel.prepare.castCount'), { n: characters.length }), detail: characters.length > 0 ? t('panel.ready') : t('panel.prepare.missing') },
        { key: 'world', done: world.length > 0, label: fill(t('panel.prepare.worldCount'), { n: world.length }), detail: world.length > 0 ? t('panel.ready') : t('panel.prepare.missing') },
      ]
      const writingRow = app.writingNow ? (chapters.find((row) => row.chapter === app.writingNow.chapter) ?? null) : null
      const main = [
        app.writingNow ? e(P2WritingNow, { key: 'writing', t, app, chapter: writingRow }) : null,
        e(P2Sec, { key: 'prepare', title: t('panel.prepare.title') },
          e('div', { className: 'nw-p2-crows' }, checks.map((row) => e(P2CheckRow, { ...row }))),
          firstOutline
            ? e('div', { className: 'nw-reading nw-p2-reading nw-p2-firstchapter' },
              e('div', { className: 'nw-reading-kicker' }, t('panel.prepare.firstChapter')),
              e('h3', { className: 'nw-reading-title' }, firstOutline.title || fill(t('chapter'), { no: 1 })),
              beats.length > 0
                ? e('ol', { className: 'nw-reading-list' }, beats.slice(0, 3).map((beat, index) => e('li', { key: index }, beat)))
                : e('p', { className: 'nw-muted' }, firstOutline.what_changes || firstOutline.opening || ''),
              e('div', { className: 'nw-p2-inline-actions' },
                e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', onClick: () => app.openFull({ kind: 'chapter', chapter: 1, view: 'outline' }) }, t('panel.prepare.openOutline')),
                e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', onClick: () => app.openReader(1) }, t('panel.prepare.read')),
              ),
            )
            : e('p', { className: 'nw-p2-hint' }, t('panel.prepare.noChapterOutline')),
          e('p', { className: 'nw-p2-note' }, t('panel.prepare.hint')),
        ),
      ]
      const aside = [
        e(P2Sec, { key: 'cast', title: t('panel.prepare.cast'), extra: e(P2Link, { label: t('panel.openSection'), onClick: () => app.openFull({ kind: 'settings' }) }) },
          characters.length > 0
            ? e('div', { className: 'nw-tags' }, characters.slice(0, 8).map((character) => e('button', {
              key: character.name,
              type: 'button',
              className: 'nw-tag is-link',
              onClick: () => app.openFull({ kind: 'character', name: character.name }),
            }, character.name, character.identity?.profileStage ? e('em', null, STAGE_LABELS[character.identity.profileStage] ?? '') : null)))
            : e('div', { className: 'nw-p2-empty-inline' },
              e('span', { className: 'nw-muted' }, t('panel.prepare.castEmpty')),
              e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', onClick: () => app.sendPrompt(t('panel.promptCast')) }, t('panel.prepare.addCast')),
            ),
        ),
        e(P2Sec, { key: 'world', title: t('panel.prepare.world'), extra: e(P2Link, { label: t('panel.openSection'), onClick: () => app.openFull({ kind: 'settings' }) }) },
          world.length > 0
            ? e('div', { className: 'nw-tags' }, world.slice(0, 8).map((entry) => e('button', {
              key: entry.name,
              type: 'button',
              className: 'nw-tag is-link',
              onClick: () => app.openFull({ kind: 'settings' }),
            }, entry.name)))
            : e('div', { className: 'nw-p2-empty-inline' },
              e('span', { className: 'nw-muted' }, t('panel.prepare.worldEmpty')),
              e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', onClick: () => app.sendPrompt(t('panel.promptWorld')) }, t('panel.prepare.addWorld')),
            ),
        ),
        e(P2Sec, { key: 'stats', title: t('panel.statsTitle') }, e(P2Stats, { rows: panelStats(app) })),
      ]
      return { main, aside }
    }

    /** The issues worth surfacing once the book is being written. */
    function writingIssues(app) {
      const t = app.t
      const snapshot = app.snapshot
      const status = snapshot?.status ?? {}
      const issues = []
      const missing = status.memory?.missing ?? []
      const stale = status.memory?.stale ?? []
      const failed = (snapshot?.reviews ?? []).filter((review) => review.verdict === 'fail')
      const unresolved = Object.values(snapshot?.foreshadowingStates ?? {}).filter((state) => state?.last_action !== 'reveal').length
      const written = new Set((snapshot?.chapters ?? []).filter((row) => row.hasText).map((row) => row.chapter))
      const last = (snapshot?.chapters ?? []).reduce((max, row) => (row.hasText ? Math.max(max, row.chapter) : max), 0)
      const gaps = []
      for (let chapter = 1; chapter <= last; chapter += 1) if (!written.has(chapter)) gaps.push(chapter)
      if (missing.length > 0) issues.push({ key: 'memory-missing', label: fill(t('panel.writing.memoryMissing'), { n: missing.length }), tone: 'is-warn', target: { kind: 'tracking', tab: 'progress' } })
      if (stale.length > 0) issues.push({ key: 'memory-stale', label: fill(t('panel.writing.memoryStale'), { n: stale.length }), tone: 'is-warn', target: { kind: 'tracking', tab: 'summaries' } })
      if (failed.length > 0) issues.push({ key: 'review', label: fill(t('panel.writing.reviewFail'), { n: failed.length }), tone: 'is-warn', target: { kind: 'reviews' } })
      if (gaps.length > 0) issues.push({ key: 'gap', label: fill(t('panel.writing.gaps'), { n: gaps.length }), tone: 'is-warn', target: { kind: 'manuscript' } })
      if (unresolved > 0) issues.push({ key: 'foreshadowing', label: fill(t('panel.writing.foreshadowing'), { n: unresolved }), tone: 'is-info', target: { kind: 'tracking', tab: 'foreshadowing' } })
      return issues.slice(0, 4)
    }

    /** The board while chapters are being written. */
    function panelWriting(app) {
      const t = app.t
      const snapshot = app.snapshot
      const chapters = snapshot?.chapters ?? []
      const status = snapshot?.status ?? {}
      const action = snapshot?.journey?.action ?? null
      const nextChapter = action?.chapter ?? status.nextChapter ?? 1
      const nextRow = chapters.find((row) => row.chapter === nextChapter) ?? null
      // Recent chapters means "the writing frontier": next, last written, then
      // neighbors. A 200-outline book must not bury chapter one under chapter ten.
      const recent = []
      const addRecent = (number) => {
        if (recent.length >= 6 || !Number.isInteger(number) || number <= 0) return
        const row = chapters.find((item) => item.chapter === number)
        if (row && !recent.some((item) => item.chapter === row.chapter)) recent.push(row)
      }
      addRecent(nextChapter)
      addRecent(status.lastWrittenChapter)
      for (let distance = 1; recent.length < 6 && distance <= 30; distance += 1) {
        addRecent(nextChapter + distance)
        addRecent(nextChapter - distance)
      }
      for (const row of chapters.slice().sort((left, right) => left.chapter - right.chapter)) addRecent(row.chapter)
      recent.sort((left, right) => left.chapter - right.chapter)
      const memories = (snapshot?.memoryRecords ?? []).slice().sort((left, right) => right.chapter - left.chapter)
      const latestMemory = memories[0] ?? null
      const issues = writingIssues(app)
      const issueBody = issues.length > 0
        ? e('div', { className: 'nw-p2-crows' }, issues.map((issue) => e(P2CheckRow, {
          key: issue.key,
          tone: issue.tone,
          label: issue.label,
          onClick: () => app.openFull(issue.target),
        })))
        : e('p', { className: 'nw-p2-hint is-good' }, t('panel.writing.noAttention'))
      const target = snapshot?.book?.wordsPerChapter
      const nextTags = []
      if (nextRow?.hasText) nextTags.push(`${(nextRow.words ?? 0).toLocaleString()}${target ? ` / ${target.toLocaleString()}` : ''} ${t('workbench.wordUnit')}`)
      nextTags.push(nextRow?.hasText ? t('panel.writing.hasText') : nextRow?.hasOutline ? t('panel.hasOutline') : t('panel.missing'))
      if (nextRow?.hasMemory) nextTags.push(nextRow.memoryFresh === false ? t('memory.outdated') : t('memory.fresh'))
      const writingRow = app.writingNow ? (chapters.find((row) => row.chapter === app.writingNow.chapter) ?? nextRow) : null
      const main = [
        app.writingNow ? e(P2WritingNow, { key: 'writing', t, app, chapter: writingRow }) : null,
        e(P2Sec, {
          key: 'focus',
          title: t('panel.writing.title'),
        },
          e('button', { type: 'button', className: 'nw-reading nw-p2-reading nw-p2-focus', onClick: () => app.openReader(nextChapter) },
            e('div', { className: 'nw-reading-kicker' }, `${t('panel.writing.nextChapter')} · ${nextChapter}`),
            e('h3', { className: 'nw-reading-title' }, nextRow?.title || fill(t('chapter'), { no: nextChapter })),
            e('div', { className: 'nw-tags' }, nextTags.map((tag, index) => e('span', { key: index, className: 'nw-tag is-plain nw-p2-meta-tag' }, tag))),
          ),
          latestMemory
            ? e('div', { className: 'nw-check nw-p2-memo' },
              e('div', { className: 'nw-check-title nw-p2-memo-head' },
                e('span', null, fill(t('panel.writing.lastSummary'), { no: latestMemory.chapter })),
                e('span', { className: `nw-tag ${latestMemory.fresh === false ? 'is-warn' : 'is-success'}` }, latestMemory.fresh === false ? t('memory.outdated') : t('memory.fresh')),
              ),
              e('p', { className: 'nw-track-sum-body' }, latestMemory.summary || '—'),
              e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', onClick: () => app.openFull({ kind: 'chapter', chapter: latestMemory.chapter, view: 'memory' }) }, t('panel.writing.openMemory')),
            )
            : e('p', { className: 'nw-muted' }, t('panel.writing.noSummary')),
        ),
        e('div', { key: 'issues', className: 'nw-p2-only-narrow' },
          e(P2Sec, { title: t('panel.writing.attention') }, issueBody),
        ),
        e(P2Sec, { key: 'recent', title: t('panel.recent'), extra: e(P2Link, { label: t('panel.writing.viewAll'), onClick: () => app.openFull({ kind: 'manuscript' }) }) },
          recent.length > 0
            ? e('div', { className: 'nw-recent' }, recent.map((row) => e(P2ChapterRow, {
              key: row.chapter,
              t,
              row,
              active: app.selected === row.chapter,
              onClick: () => app.openReader(row.chapter),
            })))
            : e('p', { className: 'nw-p2-note' }, t('panel.noChapters')),
        ),
      ]
      const aside = [
        e('div', { key: 'issues-wide', className: 'nw-p2-only-wide' },
          e(P2Sec, { title: t('panel.writing.attention') }, issueBody),
        ),
        e(P2Sec, { key: 'stats', title: t('panel.statsTitle') }, e(P2Stats, { rows: panelStats(app) })),
      ]
      return { main, aside }
    }

    /** The board once the planned book is complete. */
    function panelDone(app) {
      const t = app.t
      const snapshot = app.snapshot
      const journey = snapshot?.journey
      const progress = journey?.progress ?? {}
      const checklist = (journey?.checklist ?? []).filter((item) => item.level !== 'good')
      const reviews = snapshot?.reviews ?? []
      const status = snapshot?.status ?? {}
      const memory = snapshot?.book?.memory ?? {}
      const main = [
        e(P2Sec, { key: 'done', title: t('panel.done.title') },
          e(P2Stats, { rows: panelStats(app) }),
          e('div', { className: 'nw-journey-actions' },
            e('button', { type: 'button', className: 'nw-btn is-primary is-sm', onClick: () => app.openFull({ kind: 'export' }) }, icon('external', 14), t('panel.done.export')),
          ),
          e('p', { className: 'nw-muted' }, t('panel.done.exportHint')),
        ),
        e(P2Sec, { key: 'check', title: t('panel.done.check') },
          checklist.length > 0
            ? e('div', { className: 'nw-p2-crows' }, checklist.slice(0, 5).map((item) => e(P2CheckRow, {
              key: item.id,
              tone: `is-${item.level}`,
              label: item.label,
              static: true,
            })))
            : e('p', { className: 'nw-p2-hint is-good' }, t('panel.done.clean')),
        ),
      ]
      const aside = [
        e(P2Sec, { key: 'reviews', title: t('panel.done.reviews') },
          e('div', { className: 'nw-p2-facts' },
            e('span', null, `${t('reviews.pass')} ${reviews.filter((review) => review.verdict !== 'fail').length}`),
            e('span', null, `${t('reviews.fail')} ${reviews.filter((review) => review.verdict === 'fail').length}`),
          ),
          e('p', { className: 'nw-p2-note' }, t('panel.done.reviewHint')),
        ),
        e(P2Sec, { key: 'memory', title: t('panel.done.memory') },
          e('div', { className: 'nw-p2-facts' },
            e('span', null, `${t('memory.records')} ${memory.records ?? 0}`),
            e('span', null, `${t('memory.stale')} ${status.memory?.stale?.length ?? 0}`),
          ),
        ),
      ]
      return { main, aside }
    }

    /** Four stage-aware book facts. */
    function panelStats(app) {
      const t = app.t
      const snapshot = app.snapshot
      const chapters = snapshot?.chapters ?? []
      const characters = snapshot?.characters ?? []
      const world = snapshot?.settings?.world ?? []
      const memory = snapshot?.book?.memory ?? {}
      const foreshadowing = Object.values(snapshot?.foreshadowingStates ?? {}).filter((state) => state?.last_action !== 'reveal').length
      if (app.stage === 'setup' || app.stage === 'outline') {
        const cards = snapshot?.premise?.cards ?? []
        const filled = PREMISE_ORDER.filter((id) => premiseCardFilled(cards, id)).length
        return [
          { key: 'premise', value: `${filled}/${PREMISE_ORDER.length}`, label: t('panel.stat.premise'), onClick: () => app.openFull({ kind: 'premise' }) },
          { key: 'cast', value: characters.length, label: t('panel.stat.cast'), onClick: () => app.openFull({ kind: 'settings' }) },
          { key: 'world', value: world.length, label: t('panel.stat.world'), onClick: () => app.openFull({ kind: 'settings' }) },
          { key: 'chapters', value: chapters.length, label: t('panel.stat.chapterOutlines'), onClick: () => app.openFull({ kind: 'manuscript' }) },
        ]
      }
      if (app.stage === 'done') {
        return [
          { key: 'chapters', value: chapters.filter((row) => row.hasText).length, label: t('panel.stat.written'), onClick: () => app.openFull({ kind: 'manuscript' }) },
          { key: 'reviews', value: snapshot?.reviews?.length ?? 0, label: t('panel.stat.reviews'), onClick: () => app.openFull({ kind: 'reviews' }) },
          { key: 'memory', value: memory.records ?? 0, label: t('panel.stat.memory'), onClick: () => app.openFull({ kind: 'memory' }) },
          { key: 'foreshadowing', value: foreshadowing, label: t('panel.stat.foreshadowing'), onClick: () => app.openFull({ kind: 'tracking', tab: 'foreshadowing' }) },
        ]
      }
      return [
        { key: 'cast', value: characters.length, label: t('panel.stat.cast'), onClick: () => app.openFull({ kind: 'settings' }) },
        { key: 'world', value: world.length, label: t('panel.stat.world'), onClick: () => app.openFull({ kind: 'settings' }) },
        { key: 'memory', value: memory.records ?? 0, label: t('panel.stat.memory'), onClick: () => app.openFull({ kind: 'memory' }) },
        { key: 'foreshadowing', value: foreshadowing, label: t('panel.stat.foreshadowing'), onClick: () => app.openFull({ kind: 'tracking', tab: 'foreshadowing' }) },
      ]
    }

    /** The chapter brief shown when a planned chapter has no prose yet. */
    function P2ChapterBrief({ app, chapter, outline }) {
      const t = app.t
      const beats = Array.isArray(outline?.beats) ? outline.beats : []
      const cast = Array.isArray(outline?.characters) ? outline.characters.map((person) => person?.name).filter(Boolean) : []
      return e('div', { className: 'nw-reading nw-p2-reading' },
        e('div', { className: 'nw-reading-kicker' }, outline ? t('panel.reader.outlineGist') : t('panel.reader.noOutline')),
        e('h2', { className: 'nw-reading-title' }, outline?.title || chapter?.title || fill(t('chapter'), { no: app.selected })),
        e('p', { className: 'nw-muted' }, outline ? t('panel.reader.briefHint') : t('panel.reader.noOutlineHint')),
        beats.length > 0
          ? e('section', { className: 'nw-section' },
            e('h2', null, t('panel.reader.beats')),
            e('ol', { className: 'nw-reading-list' }, beats.slice(0, 4).map((beat, index) => e('li', { key: index }, beat))),
          )
          : null,
        e(Field, { label: t('chapter.whatChanges'), value: outline?.what_changes }),
        e(Field, { label: t('chapter.want'), value: outline?.protagonist_wants }),
        e(Field, { label: t('chapter.obstacle'), value: outline?.obstacle }),
        e(Field, { label: t('chapter.stakes'), value: outline?.at_stake }),
        e(Field, { label: t('chapter.readerGets'), value: outline?.reader_gets }),
        e(Field, { label: t('chapter.endingNote'), value: outline?.chapter_end || outline?.ending_note }),
        cast.length > 0
          ? e('div', { className: 'nw-tags', style: { marginTop: 12 } }, cast.map((name) => e('span', { key: name, className: 'nw-tag' }, name)))
          : null,
        e('div', { className: 'nw-p2-inline-actions' },
          e('button', { type: 'button', className: 'nw-btn is-primary is-sm', disabled: app.busy, onClick: () => app.sendPrompt(fill(t('panel.promptWriteChapter'), { no: app.selected })) }, icon('spark', 14), t('panel.reader.writeThis')),
          outline
            ? e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', onClick: () => app.sendPrompt(fill(t('panel.askChapter'), { no: app.selected })) }, t('panel.promptChapter'))
            : e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', onClick: () => app.sendPrompt(fill(t('panel.promptPlanChapter'), { no: app.selected })) }, t('panel.reader.planThis')),
          e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', onClick: () => app.openFull({ kind: 'chapter', chapter: app.selected, view: 'outline' }) }, t('panel.reader.openOutline')),
        ),
      )
    }

    /** The workbench writing wait, reused in the sidebar at panel scale. */
    function P2WritingNow({ t, app, chapter }) {
      if (!app.writingNow || !chapter) return null
      const writing = app.writingNow
      return e('section', { className: 'nw-p2-writing' },
        e(WritingScene, {
          app: {
            t,
            writing,
            runningNow: true,
            trackedWaiting: app.waiting === true,
            trackedSession: writing.sessionId ?? app.sessionId,
            onOpenSession: () => {},
            onWrite: () => {},
            onChapterView: () => {},
          },
          chapter,
          compact: true,
        }),
      )
    }

    /** Full-width reader for one chapter, including outline briefs for unwritten ones. */
    function P2Reader(props) {
      const t = props.t
      const app = props.app
      const chapter = app.chapter
      const outline = app.chapterOutline
      if (!chapter) {
        return e('div', { className: 'nw-p2-reader' },
          e('div', { className: 'nw-p2-readerbar' },
            e(IconButton, { glyph: 'chevronLeft', size: 16, label: t('panel.reader.back'), tipAlign: 'start', onClick: app.onBack }),
            e('div', { className: 'nw-p2-readertitle' }, e('div', { className: 'nw-p2-reader-name' }, t('panel.noChapter'))),
          ),
          e('div', { className: 'nw-p2-readerscroll' }, e('p', { className: 'nw-p2-note' }, t('panel.reader.empty'))),
        )
      }
      const target = app.book?.wordsPerChapter
      const review = chapter.review
      const meta = []
      if (chapter.hasText) meta.push(fill(t('chapter.words'), { n: (chapter.words ?? 0).toLocaleString() }))
      if (target) meta.push(fill(t('chapter.target'), { n: target.toLocaleString() }))
      if (chapter.hasOutline) meta.push(t('panel.hasOutline'))
      if (review) meta.push(review.verdict === 'fail' ? fill(t('chapter.reviewFail'), { n: review.blockers || review.issues }) : t('chapter.reviewPass'))
      if (chapter.hasMemory) meta.push(chapter.memoryFresh === false ? t('memory.outdated') : t('memory.fresh'))
      const paragraphs = chapter.hasText && app.text !== null ? splitManuscript(app.text).paragraphs : []
      const previous = app.neighbors?.previous ?? null
      const next = app.neighbors?.next ?? null
      return e('div', { className: 'nw-p2-reader' },
        e('div', { className: 'nw-p2-readerbar' },
          e(IconButton, { glyph: 'chevronLeft', size: 16, label: t('panel.reader.back'), tipAlign: 'start', onClick: app.onBack }),
          e('div', { className: 'nw-p2-readertitle' },
            e('div', { className: 'nw-p2-reader-no' }, fill(t('chapter'), { no: chapter.chapter })),
            e('div', { className: 'nw-p2-reader-name', title: chapter.title }, chapter.title || ''),
          ),
          e('div', { className: 'nw-p2-readertools' },
            e(IconButton, { glyph: 'chevronLeft', label: t('panel.reader.prev'), disabled: !previous, onClick: previous ? () => app.openReader(previous) : undefined }),
            e(IconButton, { glyph: 'chevronRight', label: t('panel.reader.next'), disabled: !next, onClick: next ? () => app.openReader(next) : undefined }),
            e(IconButton, { glyph: 'external', label: t('panel.openBoard'), tipAlign: 'end', onClick: () => app.openFull({ kind: 'chapter', chapter: chapter.chapter, view: chapter.hasText ? 'text' : 'outline' }) }),
          ),
        ),
        e('div', { className: 'nw-p2-readerscroll' },
          e('div', { className: 'nw-tags nw-p2-readermeta' }, meta.map((item, index) => e('span', { key: index, className: 'nw-tag is-plain nw-p2-meta-tag' }, item))),
          e(P2WritingNow, { t, app, chapter }),
          chapter.hasText
            ? app.textLoading || (app.text === null && !app.textError)
              ? e('div', { className: 'nw-p2-readerstate' }, e('span', { className: 'nw-spinner' }), t('panel.reader.loading'))
              : app.textError
                ? e('div', { className: 'nw-p2-readerstate is-error' },
                  e('span', null, app.textError),
                  e('button', { type: 'button', className: 'nw-p2-inline-link', onClick: app.onReloadText }, t('panel.reader.retry')),
                )
                : e('article', { className: 'nw-reading nw-p2-reading' },
                  e('h2', { className: 'nw-reading-title' }, chapter.title || fill(t('chapter'), { no: chapter.chapter })),
                  paragraphs.length > 0
                    ? paragraphs.map((paragraph, index) => e('p', { key: index }, paragraph))
                    : e('p', { className: 'nw-muted' }, t('panel.reader.emptyFile')),
                  e('div', { className: 'nw-p2-inline-actions' },
                    e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', disabled: app.busy, onClick: () => app.sendPrompt(fill(t('panel.promptRewrite'), { no: chapter.chapter })) }, icon('edit', 14), t('panel.reader.rewrite')),
                    e('button', { type: 'button', className: 'nw-btn is-ghost is-sm', onClick: () => app.sendPrompt(fill(t('panel.askChapter'), { no: chapter.chapter })) }, t('panel.promptChapter')),
                  ),
                )
            : e(P2ChapterBrief, { app, chapter, outline }),
        ),
      )
    }

    /** The sticky prompt row under the board. */
    function P2Footer(props) {
      const t = props.t
      const app = props.app
      const prompts = []
      if (app.stage === 'setup') {
        prompts.push({ key: 'setup', label: t('panel.promptContinueSetup'), prompt: t('panel.promptContinueSetupText') })
        prompts.push({ key: 'missing', label: t('panel.askMissingShort'), prompt: t('panel.askMissing') })
      } else if (app.stage === 'outline') {
        prompts.push({ key: 'outline', label: t('panel.promptContinueOutline'), prompt: t('panel.promptContinueOutlineText') })
        prompts.push({ key: 'missing', label: t('panel.askMissingShort'), prompt: t('panel.askMissing') })
      } else if (app.stage === 'prepare') {
        prompts.push({ key: 'prepare', label: t('panel.promptContinuePrepare'), prompt: t('panel.promptContinuePrepareText') })
        prompts.push({ key: 'status', label: t('panel.promptStatus'), prompt: t('panel.askStatus') })
      } else if (app.stage === 'writing') {
        prompts.push({ key: 'status', label: t('panel.promptStatus'), prompt: t('panel.askStatus') })
        prompts.push({ key: 'chapter', label: t('panel.promptChapter'), prompt: fill(t('panel.askChapter'), { no: app.selected ?? app.snapshot?.status?.nextChapter ?? 1 }) })
      } else {
        prompts.push({ key: 'done', label: t('panel.promptDone'), prompt: t('panel.promptDoneText') })
        prompts.push({ key: 'status', label: t('panel.promptStatus'), prompt: t('panel.askStatus') })
      }
      return e('div', { className: 'nw-p2-foot' },
        e('div', { className: 'nw-p2-foot-inner' },
          prompts.map((item) => e('button', {
            key: item.key,
            type: 'button',
            className: 'nw-btn is-secondary is-sm',
            disabled: app.busy || app.waiting,
            onClick: () => app.sendPrompt(item.prompt),
          }, item.label)),
        ),
      )
    }

    /**
     * The compact novel panel in the right sidebar.
     * @param {object} props - slot props plus t/openFull/inputActions.
     * @returns {any} the panel.
     */
    function NovelSidebarPanel(props) {
      const t = props.t
      const sessionId = props.sessionId
      const cwd = props.useSessions ? props.useSessions((state) => state.byId[sessionId]?.cwd) : undefined
      const useSessionStatus = props.useSessionStatus ?? (() => undefined)
      const tracked = useSessionStatus((statuses) => (sessionId ? statuses.get(sessionId) : undefined))
      const useChat = props.useChat ?? (() => 0)
      const runningCalls = useChat((state) => state?.legacy?.runningCalls?.length ?? 0)
      const hasPartial = useChat((state) => (state?.legacy?.partial ? 1 : 0))
      // The last user turn tells us whether this busy turn is a write (the
      // panel otherwise only knows that the Agent is running). The plugin's
      // write prompts all start with 写第 N 章 / 第 N 章已经有正文.
      const lastUserText = useChat((state) => {
        const nodes = Array.isArray(state?.legacy?.nodes) ? state.legacy.nodes : []
        for (let index = nodes.length - 1; index >= 0; index -= 1) {
          const node = nodes[index]
          if (node?.kind !== 'user') continue
          return (Array.isArray(node.content) ? node.content : [])
            .map((block) => (block?.type === 'text' ? String(block.text ?? '') : ''))
            .filter(Boolean)
            .join(' ')
        }
        return ''
      })
      const busy = tracked?.running === true || runningCalls > 0 || hasPartial > 0
      const waiting = tracked?.pendingInteraction !== undefined

      const [books, setBooks] = useState([])
      const [phase, setPhase] = useState('loading')
      const [error, setError] = useState('')
      const [snapshot, setSnapshot] = useState(null)
      const [selected, setSelected] = useState(null)
      const [view, setView] = useState('board')
      const [text, setText] = useState(null)
      const [textError, setTextError] = useState('')
      const [textLoading, setTextLoading] = useState(false)
      const [textReload, setTextReload] = useState(0)
      const [reload, setReload] = useState(0)
      const [refreshing, setRefreshing] = useState(false)
      const [updatedAt, setUpdatedAt] = useState(null)
      const [flash, setFlash] = useState(false)
      const [notice, setNotice] = useState('')
      const [stampMode, setStampMode] = useState('book')
      const [persistedWriting, setPersistedWriting] = useState(null)

      const seqRef = useRef(0)
      const stampRef = useRef('')
      const signatureRef = useRef('')
      const loadedRef = useRef(false)
      const cwdRef = useRef(cwd)
      const flashTimerRef = useRef(null)
      const sawRunningRef = useRef(false)

      const book = books[0] ?? null
      /** Read the workbench's persisted write (chat-started writes have none). */
      useEffect(() => {
        if (!book?.key || !busy) { setPersistedWriting(null); return }
        setPersistedWriting(readWritingState(book.key))
      }, [book?.key, busy])
      const chapters = snapshot?.chapters ?? []
      const chapter = selected === null ? null : chapters.find((row) => row.chapter === selected) ?? null
      const chapterOutline = selected === null ? null : snapshot?.chapterOutlines?.[String(selected)]?.data ?? null
      const neighbors = useMemo(() => {
        const rows = chapters.slice().sort((left, right) => left.chapter - right.chapter)
        const index = rows.findIndex((row) => row.chapter === selected)
        return {
          previous: index > 0 ? rows[index - 1].chapter : null,
          next: index >= 0 && index < rows.length - 1 ? rows[index + 1].chapter : null,
        }
      }, [chapters, selected])

      /** Choose a sensible chapter when the panel opens: what was open, else the next one. */
      const pickChapter = useCallback((body, preferred) => {
        const rows = body?.chapters ?? []
        if (preferred && rows.some((row) => row.chapter === preferred)) return preferred
        const next = body?.status?.nextChapter
        if (rows.some((row) => row.chapter === next)) return next
        const written = rows.filter((row) => row.hasText).slice(-1)[0]
        return written?.chapter ?? rows[0]?.chapter ?? null
      }, [])

      const flashUpdated = useCallback(() => {
        setFlash(true)
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
        const timer = setTimeout(() => setFlash(false), 3500)
        if (timer && typeof timer.unref === 'function') timer.unref()
        flashTimerRef.current = timer
      }, [])

      /** Full load: the shelf listing, then the matching book's snapshot. */
      const loadBook = useCallback(async () => {
        const seq = seqRef.current + 1
        seqRef.current = seq
        if (!loadedRef.current) {
          setPhase('loading')
          setError('')
        }
        try {
          const listing = await apiGet('books')
          if (seq !== seqRef.current) return null
          const rows = (Array.isArray(listing.books) ? listing.books : []).map((row) => ({ ...row, key: `${row.root}|${row.relDir}` }))
          const match = pickBookForCwd(rows, cwd)
          if (!match) {
            setBooks([])
            setSnapshot(null)
            setPhase('empty')
            return null
          }
          setBooks([match])
          const body = await apiGet(`book?root=${encodeURIComponent(match.root)}&dir=${encodeURIComponent(match.relDir)}`)
          if (seq !== seqRef.current) return null
          stampRef.current = typeof body.stamp === 'string' ? body.stamp : ''
          setStampMode(stampRef.current ? 'stamp' : 'book')
          signatureRef.current = panelSnapshotSignature(body)
          setSnapshot(body)
          setPhase('ready')
          setUpdatedAt(Date.now())
          if (!loadedRef.current) {
            loadedRef.current = true
            const stored = readPanelView(match.key)
            setView(stored?.view === 'reader' ? 'reader' : 'board')
            setSelected(pickChapter(body, stored?.chapter))
          } else {
            setSelected((current) => (current !== null && (body.chapters ?? []).some((row) => row.chapter === current) ? current : pickChapter(body, current)))
          }
          return body
        } catch (cause) {
          if (seq !== seqRef.current) return null
          setError(cause instanceof Error ? cause.message : String(cause))
          setPhase((current) => (current === 'ready' ? current : 'error'))
          return null
        }
      }, [cwd, pickChapter])

      /** Quiet refresh of the open book, or a manual one with a visible spinner. */
      const refreshSnapshot = useCallback(async (reason = 'manual') => {
        if (!book) return null
        const quiet = reason === 'auto'
        if (!quiet) setRefreshing(true)
        try {
          const body = await apiGet(`book?root=${encodeURIComponent(book.root)}&dir=${encodeURIComponent(book.relDir)}`)
          const signature = panelSnapshotSignature(body)
          const changed = signature !== signatureRef.current
          if (typeof body.stamp === 'string' && body.stamp) {
            stampRef.current = body.stamp
            setStampMode('stamp')
          }
          signatureRef.current = signature
          if (changed || !quiet) {
            setSnapshot(body)
            setPhase('ready')
            setSelected((current) => (current !== null && (body.chapters ?? []).some((row) => row.chapter === current) ? current : pickChapter(body, current)))
          }
          if (changed) {
            setUpdatedAt(Date.now())
            flashUpdated()
          } else if (!quiet) {
            setUpdatedAt(Date.now())
          }
          return body
        } catch (cause) {
          if (!quiet) {
            setError(cause instanceof Error ? cause.message : String(cause))
            setNotice(t('panel.refreshFailed'))
          }
          return null
        } finally {
          if (!quiet) setRefreshing(false)
        }
      }, [book, flashUpdated, pickChapter, t])

      /** Initial load and manual reload. */
      useEffect(() => {
        if (cwdRef.current !== cwd) {
          cwdRef.current = cwd
          loadedRef.current = false
          setSnapshot(null)
          setSelected(null)
          setView('board')
        }
        void loadBook()
        return () => { seqRef.current += 1 }
      }, [cwd, loadBook, reload])

      /** Persist the chapter the author was reading, per book. */
      useEffect(() => {
        if (!book || phase !== 'ready' || selected === null) return
        writePanelView(book.key, { chapter: selected, view })
      }, [book?.key, phase, selected, view])

      /** Turn-end is the strongest "the Agent just finished" signal. */
      useEffect(() => {
        if (busy) { sawRunningRef.current = true; return }
        if (!sawRunningRef.current) return
        sawRunningRef.current = false
        void refreshSnapshot('auto')
      }, [busy, refreshSnapshot])

      /** Cheap stamp polling catches writes from another session or another process. */
      useEffect(() => {
        if (!book || phase !== 'ready') return undefined
        if (typeof document === 'undefined' || typeof window === 'undefined') return undefined
        let alive = true
        let busy = false
        let timer = null
        const check = async () => {
          if (!alive || busy || document.visibilityState === 'hidden') return
          // The workbench writes this key when a background write starts; a
          // cheap read keeps the panel's wait card in sync without polling state.
          setPersistedWriting(readWritingState(book.key))
          busy = true
          try {
            if (stampMode === 'stamp') {
              const value = await apiGet(`stamp?root=${encodeURIComponent(book.root)}&dir=${encodeURIComponent(book.relDir)}`)
              if (!alive) return
              const stamp = String(value.stamp ?? '')
              if (!stamp) return
              if (stampRef.current && stamp !== stampRef.current) {
                stampRef.current = stamp
                await refreshSnapshot('auto')
              } else if (!stampRef.current) {
                stampRef.current = stamp
              }
            } else {
              await refreshSnapshot('auto')
            }
          } catch {
            if (alive && stampMode === 'stamp') setStampMode('book')
          } finally {
            busy = false
          }
        }
        timer = setInterval(() => { void check() }, stampMode === 'stamp' ? 4000 : 15000)
        const onVisible = () => { if (document.visibilityState === 'visible') void check() }
        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('focus', onVisible)
        return () => {
          alive = false
          if (timer) clearInterval(timer)
          document.removeEventListener('visibilitychange', onVisible)
          window.removeEventListener('focus', onVisible)
        }
      }, [book, phase, stampMode, refreshSnapshot])

      /** The reader fetches the chapter's prose, and refetches when the file moves. */
      useEffect(() => {
        if (view !== 'reader' || !book || !chapter?.path || !chapter.hasText) {
          setText(null)
          setTextError('')
          setTextLoading(false)
          return undefined
        }
        let alive = true
        setTextLoading(true)
        setTextError('')
        apiGet(`file?root=${encodeURIComponent(book.root)}&dir=${encodeURIComponent(book.relDir)}&path=${encodeURIComponent(chapter.path)}`)
          .then((value) => { if (alive) setText(value.text ?? '') })
          .catch((cause) => {
            if (!alive) return
            setText(null)
            setTextError(cause instanceof Error ? cause.message : String(cause))
          })
          .finally(() => { if (alive) setTextLoading(false) })
        return () => { alive = false }
      }, [view, book, chapter?.path, chapter?.mtime, chapter?.hasText, textReload])

      useEffect(() => () => {
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
      }, [])

      useEffect(() => {
        if (!notice) return undefined
        const timer = setTimeout(() => setNotice(''), 3600)
        if (timer && typeof timer.unref === 'function') timer.unref()
        return () => clearTimeout(timer)
      }, [notice])

      const sendPrompt = useCallback((prompt) => {
        const actions = props.inputActions
        if (!actions || typeof actions.setDraft !== 'function' || typeof actions.submit !== 'function') {
          setNotice(t('panel.sendFailed'))
          return false
        }
        actions.setDraft(String(prompt ?? ''))
        actions.submit()
        setNotice('')
        return true
      }, [props.inputActions, t])

      const openFull = useCallback((target) => {
        if (typeof props.openFull === 'function') props.openFull(target ?? undefined)
      }, [props.openFull])

      const openReader = useCallback((number) => {
        if (number === null || number === undefined) return
        setSelected(Number(number))
        setView('reader')
      }, [])

      const stage = panelStage(snapshot)
      const stageLabel = panelCopy(t, PANEL_STAGE_KEYS[stage], { setup: '立项', outline: '大纲', prepare: '开写准备', writing: '写正文', done: '完本' }[stage] ?? '')
      const journey = snapshot?.journey ?? null
      const status = snapshot?.status ?? {}
      const written = status.writtenChapters ?? 0
      const total = snapshot?.book?.totalChapters ?? null
      const meta = []
      if (book?.genre) meta.push(book.genre)
      if (stage === 'setup') {
        meta.push(fill(t('panel.setup.progress'), { done: PREMISE_ORDER.filter((id) => premiseCardFilled(snapshot?.premise?.cards ?? [], id)).length, total: PREMISE_ORDER.length }))
      } else if (stage === 'outline') {
        meta.push(fill(t('panel.outline.meta'), { volumes: (snapshot?.volumes ?? []).length, chapters: Object.keys(snapshot?.chapterOutlines ?? {}).length }))
      } else if (stage === 'prepare') {
        meta.push(fill(t('panel.prepare.meta'), {
          chapters: Object.keys(snapshot?.chapterOutlines ?? {}).length,
          cast: (snapshot?.characters ?? []).length,
          world: (snapshot?.settings?.world ?? []).length,
        }))
      } else {
        meta.push(`${written}/${total ?? '?'} ${t('workbench.chapterUnit')}`)
        meta.push(`${(status.totalWords ?? 0).toLocaleString()} ${t('workbench.wordUnit')}`)
      }
      const stepIndex = journey?.lifecycle ?? (stage === 'prepare' ? 2 : stage === 'setup' ? 0 : stage === 'outline' ? 1 : 3)
      // A background write started from the workbench has a persisted chapter
      // record. A write started from the chat has none, so infer it from the
      // last user prompt, with the next unwritten chapter as a fallback.
      const persisted = busy && persistedWriting ? persistedWriting : null
      const promptMatch = /写第\s*(\d+)\s*章/.exec(String(lastUserText ?? ''))
        ?? /第\s*(\d+)\s*章\s*已经有正文/.exec(String(lastUserText ?? ''))
      const promptedChapter = promptMatch ? Number(promptMatch[1]) : null
      const inferredChapter = !persisted && busy && selected !== null
        ? (promptedChapter
          // A prompt names the chapter; never fall through to the next chapter
          // when the author asked to rewrite a different one.
          ? (promptedChapter === selected ? promptedChapter : null)
          : (selected === status.nextChapter && chapter && !chapter.hasText ? selected : null))
        : null
      const writingChapter = persisted?.chapter ?? inferredChapter ?? null
      const writingNow = Boolean(writingChapter && writingChapter === selected && (busy || waiting))
      const writingNowState = writingNow ? {
        chapter: writingChapter,
        state: 'running',
        startedAt: persisted?.startedAt ?? Date.now(),
        sessionId: persisted?.sessionId ?? sessionId,
        baseline: persisted?.baseline ?? { hasText: Boolean(chapter?.hasText), mtime: chapter?.mtime ?? 0, words: chapter?.words ?? 0 },
      } : null
      const app = {
        t, snapshot, book, stage, stageLabel, status, journey, selected, chapter, chapterOutline, neighbors,
        text, textLoading, textError, busy, waiting, writingNow: writingNowState,
        openFull, openReader, sendPrompt,
        onBack: () => setView('board'),
        onReloadText: () => setTextReload((value) => value + 1),
      }
      const secondary = {
        setup: { label: t('panel.openPremise'), onClick: () => openFull({ kind: 'premise' }) },
        outline: { label: t('panel.openOutline'), onClick: () => openFull({ kind: 'outline' }) },
        prepare: { label: t('panel.openSettings'), onClick: () => openFull({ kind: 'settings' }) },
        writing: { label: t('panel.openStatus'), onClick: () => openFull({ kind: 'tracking', tab: 'progress' }) },
        done: { label: t('panel.openDone'), onClick: () => openFull({ kind: 'export' }) },
      }[stage]
      const sections = snapshot ? (stage === 'setup' ? panelSetup(app) : stage === 'outline' ? panelOutline(app) : stage === 'prepare' ? panelPrepare(app) : stage === 'writing' ? panelWriting(app) : panelDone(app)) : { main: [], aside: [] }
      const header = e(P2Header, {
        t,
        book,
        stage,
        stageLabel: snapshot ? stageLabel : '',
        stepIndex,
        meta,
        busy,
        waiting,
        flash,
        updatedAt,
        refreshing,
        onRefresh: () => setReload((value) => value + 1),
        onOpenFull: () => openFull(null),
      })
      const stateBody = phase === 'loading' && !snapshot
        ? e('div', { className: 'nw-p2-skeleton' },
          e('div', { className: 'nw-p2-skeleton-card' }),
          e('div', { className: 'nw-p2-skeleton-line is-wide' }),
          e('div', { className: 'nw-p2-skeleton-line' }),
          e('div', { className: 'nw-p2-skeleton-line is-short' }),
        )
        : phase === 'empty'
          ? e('div', { className: 'nw-p2-empty' },
            e('div', { className: 'nw-p2-empty-mark' }, icon('book', 22)),
            e('h2', null, t('panel.empty')),
            e('p', null, t('panel.emptyHint')),
            e('div', { className: 'nw-p2-inline-actions' },
              e('button', { type: 'button', className: 'nw-btn is-primary is-sm', onClick: () => openFull(null) }, t('panel.openBoard')),
              e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', onClick: () => setReload((value) => value + 1) }, t('state.retry')),
            ),
          )
          : phase === 'error' && !snapshot
            ? e('div', { className: 'nw-p2-empty is-error' },
              e('div', { className: 'nw-p2-empty-mark' }, icon('alert', 22)),
              e('h2', null, t('state.error')),
              e('p', null, error),
              e('button', { type: 'button', className: 'nw-btn is-secondary is-sm', onClick: () => setReload((value) => value + 1) }, t('state.retry')),
            )
            : view === 'reader'
              ? e(P2Reader, { t, app })
              : [
                e('div', { key: 'scroll', className: 'nw-p2-scroll' },
                  e('div', { className: 'nw-p2-grid' },
                    e('div', { className: 'nw-p2-main' },
                      e(P2Next, {
                        t,
                        stageLabel,
                        action: journey?.action ?? null,
                        busy,
                        waiting,
                        secondary,
                        onPrompt: sendPrompt,
                        onExport: () => openFull({ kind: 'export' }),
                      }),
                      sections.main,
                    ),
                    e('aside', { className: 'nw-p2-aside' }, sections.aside),
                  ),
                ),
                e(P2Footer, { key: 'foot', t, app }),
              ]
      return e('div', { className: 'nw-root' }, e('style', null, CSS),
        e('div', { className: 'nw-p2' },
          header,
          stateBody,
          notice ? e('div', { className: 'nw-p2-notice' }, notice) : null,
        ),
      )
    }

    /** Title chip for the right-sidebar novel panel tab. */
    function PanelTitle(props) {
      const t = props.t
      return e('span', null, t('panel.tabTitle'))
    }

    /** Sidebar entry glyph. */
    function PanelIcon(props) {
      const size = typeof props.size === 'number' ? props.size : 20
      return e('img', { className: 'nw-panel-logo', src: NARRACAT_LOGO, width: size, height: size, alt: 'NarraCat' })
    }

    /**
     * Header utility that opens the novel panel. Hidden when the Session's
     * workspace has no book.
     * @param {object} props - slot props plus t/sessionId/open.
     * @returns {any} the button or null.
     */
    function NovelPanelButton(props) {
      const t = props.t
      const cwd = props.useSessions ? props.useSessions((state) => state.byId[props.sessionId]?.cwd) : undefined
      const [hasBook, setHasBook] = useState(null)
      useEffect(() => {
        let alive = true
        apiGet('books')
          .then((value) => {
            if (!alive) return
            const target = barePath(cwd)
            setHasBook((Array.isArray(value.books) ? value.books : []).some((book) => barePath(book.root) === target || barePath(book.dir) === target || (target.length > 0 && target.startsWith(`${barePath(book.dir)}/`))))
          })
          .catch(() => { if (alive) setHasBook(true) })
        return () => { alive = false }
      }, [cwd])
      if (hasBook === false) return null
      return e('button', {
        type: 'button',
        title: t('panel.openHint'),
        'aria-label': t('panel.tabTitle'),
        onClick: () => { if (typeof props.open === 'function') props.open() },
        style: {
          height: 26, padding: '0 9px', borderRadius: 7, border: '1px solid var(--dsw-alias-border-l1)',
          background: 'var(--dsw-alias-bg-base)', color: 'var(--dsw-alias-label-primary)', font: 'inherit', fontSize: 12, cursor: 'pointer',
        },
      }, t('panel.tabTitle'))
    }

// ---- 90-register.js ----
    return {
      inject: ['slots', 'locale', 'uiWorkspace', 'sidebarRightTabs', 'sessions', 'remote', 'remote.session', 'layout'],
      apply(ctx) {
        /** @type {Array<() => void>} */
        const disposers = []
        for (const [locale, dictionary] of Object.entries({ zh, en })) {
          try {
            disposers.push(ctx.locale.register(NS, locale, dictionary))
          } catch {
            // An older Client without incremental registration still renders the
            // built-in Chinese copy below.
          }
        }
        ctx.effect(() => () => { for (const dispose of disposers) dispose() }, 'novel-workbench: dictionaries')

        const translate = ctx.locale.bind(NS)
        const t = (key) => {
          const value = translate(key)
          return value === key ? (zh[key] ?? key) : value
        }

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: 'novel-workbench',
          locale: NS,
          inject: () => ({
            mode: 'page',
            t,
            writeChapter,
            runPrompt,
            openWritingSession,
            readWritingSessionId: readStoredSession,
            pickDirectory: async () => {
              const api = ctx.get('uiWorkspace')
              if (!api || typeof api.pickDirectory !== 'function') return null
              try {
                return await api.pickDirectory()
              } catch {
                return null
              }
            },
            startWritingSession: async (book) => {
              // Open a blank session rooted at this exact book. `session.create`
              // takes a Workspace or an explicit cwd, not both; a nested book
              // needs its own cwd or agent tools cannot tell books apart.
              if (!book) return { ok: false, error: t('session.unavailable') }
              try {
                const sessionId = await ensureSession(book, { fresh: true })
                openWritingSession(sessionId)
                openNovelPanelSoon()
                return { ok: true, sessionId }
              } catch (error) {
                return { ok: false, error: error instanceof Error ? error.message : String(error) }
              }
            },
          }),
        }, NovelApp))

        // ---- background writing: one reusable session per book -------------
        /** In-memory fallback for the writing-session id when localStorage is absent. */
        const writingSessionFallback = new Map()
        const sessionKeyOf = (book) => `dsh.novel.write:${book.root}|${book.relDir}`
        const readStoredSession = (book) => {
          const fallback = writingSessionFallback.get(sessionKeyOf(book)) ?? null
          try {
            return globalThis.localStorage?.getItem(sessionKeyOf(book)) ?? fallback
          } catch {
            return fallback
          }
        }
        const storeSession = (book, sessionId) => {
          writingSessionFallback.set(sessionKeyOf(book), sessionId)
          try { globalThis.localStorage?.setItem(sessionKeyOf(book), sessionId) } catch { /* private mode */ }
        }
        const mintRequestId = () => (globalThis.crypto?.randomUUID?.()
          ?? `novel-${Date.now()}-${Math.random().toString(16).slice(2)}`)

        /** The Session target for one book: its own Workspace when the book is
         *  the workspace root, otherwise an explicit cwd so agent tools resolve
         *  exactly this book even in a multi-book workspace. */
        const targetOf = (book) => {
          const same = barePath(book.dir) === barePath(book.root)
          return same && book.workspaceId ? { workspaceId: book.workspaceId } : { cwd: book.dir }
        }

        /**
         * Reuse the book's writing Session, or create one rooted at the book.
         * Primary path: the remote session RPC with an explicit book cwd.
         * Fallback: the workspace UI service, for builds where that RPC is not
         * injected or rejects a nested book cwd. The agent tools still resolve
         * the book from the workspace, and the + button stops failing.
         */
        const ensureSession = async (book, options = {}) => {
          const remote = ctx.get('remote')
          const session = remote && remote.session
          const stored = options.fresh ? null : readStoredSession(book)
          let remoteError = null
          if (session && typeof session.create === 'function' && typeof session.prompt === 'function') {
            try {
              const created = await session.create({
                ...targetOf(book),
                ...(stored ? { sessionId: stored } : {}),
                agentPreset: 'novel',
              })
              // The DSH remote face returns RemoteResult<{ sessionId }>; some
              // builds unwrap it. Accept both shapes so a created Session is
              // not mistaken for a failure (and no orphan is left behind).
              if (created && created.ok === false) throw new Error(created.error?.message ?? t('write.noSession'))
              const sessionId = created?.sessionId ?? created?.value?.sessionId ?? stored
              if (sessionId) {
                storeSession(book, sessionId)
                return sessionId
              }
            } catch (error) {
              remoteError = error
            }
          }
          const workspaceUi = ctx.get('uiWorkspace')
          if (workspaceUi && typeof workspaceUi.connectWorkspace === 'function' && book.workspaceId) {
            const sessionId = stored ?? await workspaceUi.connectWorkspace(book.workspaceId, { agentPreset: 'novel' })
            if (!sessionId) throw new Error(t('write.noSession'))
            storeSession(book, sessionId)
            return sessionId
          }
          if (remoteError) throw remoteError
          throw new Error(t('write.unavailable'))
        }

        /**
         * Admit one prompt through the Client session face. `remote.session` is
         * not part of every client profile; `sessions.using()` + the binding's
         * ISession.prompt() is the supported path. The remote fallback stays for
         * hosts that expose only the RPC.
         * @param {string} sessionId - writing Session id.
         * @param {string} text - prompt text.
         * @returns {Promise<void>} resolves once the prompt is admitted.
         */
        const promptSession = async (sessionId, text) => {
          const sessions = ctx.get('sessions')
          if (sessions && typeof sessions.using === 'function') {
            await sessions.using(sessionId, { source: 'gateway' }, async (reference) => {
              await reference.ready
              const result = await reference.binding.session.prompt(
                [{ type: 'text', text }], 'queue', undefined, mintRequestId(),
              )
              if (!result || result.ok === false) {
                throw new Error(result?.error?.message ?? t('write.failed'))
              }
            })
            return
          }
          const remote = ctx.get('remote')
          if (remote?.session && typeof remote.session.prompt === 'function') {
            const result = await remote.session.prompt({
              requestId: mintRequestId(),
              sessionId,
              mode: 'queue',
              content: [{ type: 'text', text }],
            })
            if (result && result.ok === false) throw new Error(result.error?.message ?? t('write.failed'))
            return
          }
          throw new Error(t('write.unavailable'))
        }

        /**
         * Start writing one chapter in a background Session: reuse the book's
         * writing Session (linear writing keeps one conversation per book), or
         * create it, then admit the prompt without opening the Session.
         * @param {object} book - scanned book row.
         * @param {number} chapter - chapter to write.
         * @param {{ hasText?: boolean, hasOutline?: boolean }} [state] - chapter state.
         * @returns {Promise<{ sessionId: string }>} the writing Session.
         */
        const writeChapter = async (book, chapter, state = {}) => {
          const sessionId = await ensureSession(book)
          const prompt = state.hasText
            ? `第 ${chapter} 章已经有正文。我想改这一章：先打开改写稿，按我的要求改，改完保存好再告诉我；不要直接改正式正文。先问我最想改哪一点。`
            : state.hasOutline === false
              ? `写第 ${chapter} 章。本章还没有章纲：先补一份简短的章纲（场景、冲突、收束），再看本章资料动笔；写完保存好，告诉我结果。`
              : `写第 ${chapter} 章。先看这本书的写作现状和本章资料，按前面定下的写法写完、保存好，再告诉我结果。`
          await promptSession(sessionId, prompt)
          return { sessionId }
        }

        /**
         * Send one guided prompt into the book's writing Session and (optionally)
         * bring that Session on screen. Setup and outline need a conversation,
         * so the workbench uses this instead of a background write.
         */
        const runPrompt = async (book, prompt, options = {}) => {
          const sessionId = await ensureSession(book)
          await promptSession(sessionId, String(prompt ?? ''))
          if (options.open !== false) {
            openWritingSession(sessionId)
            openNovelPanelSoon()
          }
          return { sessionId }
        }

        /** Bring the writing Session on screen. */
        const openWritingSession = (sessionId) => {
          const workspaceUi = ctx.get('uiWorkspace')
          if (!workspaceUi || typeof workspaceUi.openSession !== 'function' || !sessionId) return
          workspaceUi.openSession(sessionId)
        }

        ctx.slots.inject('conversation.view', () => ctx.slots.register({
          name: 'conversation.view',
          id: 'novel-workbench',
          order: 20,
          label: () => t('view.label'),
          locale: NS,
          inject: () => ({
            t,
            mode: 'session',
            writeChapter,
            runPrompt,
            openWritingSession,
            readWritingSessionId: readStoredSession,
            startWritingSession: async (book) => {
              if (!book) return { ok: false, error: t('session.unavailable') }
              try {
                const sessionId = await ensureSession(book, { fresh: true })
                openWritingSession(sessionId)
                openNovelPanelSoon()
                return { ok: true, sessionId }
              } catch (error) {
                return { ok: false, error: error instanceof Error ? error.message : String(error) }
              }
            },
          }),
        }, NovelApp))

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: 'novel-workbench',
          order: 40,
          label: () => t('panel'),
          locale: NS,
          inject: () => ({ t }),
        }, PanelIcon))

        /** Open the right-sidebar novel panel once a Session is on screen. */
        const openNovelPanelSoon = () => {
          let tries = 0
          const attempt = () => {
            tries += 1
            const sidebar = ctx.get('sidebarRight')
            if (sidebar && typeof sidebar.openTab === 'function') {
              try {
                sidebar.openTab(NOVEL_PANEL_KIND)
                return
              } catch {
                // The Session may not be mounted yet; retry a few times.
              }
            }
            if (tries < 6) setTimeout(attempt, 400)
          }
          setTimeout(attempt, 300)
        }

        // Right-sidebar page type: the novel panel beside the conversation.
        ctx.effect(() => {
          const tabs = ctx.get('sidebarRightTabs')
          if (!tabs || typeof tabs.register !== 'function') return () => {}
          return tabs.register({
            id: NOVEL_PANEL_ID,
            kind: NOVEL_PANEL_KIND,
            priority: 'builtin',
            title: () => t('panel.tabTitle'),
          })
        }, 'novel: sidebar panel type')
        ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab',
          key: NOVEL_PANEL_ID,
          locale: NS,
          inject: () => ({
            t,
            openFull: (target) => {
              // The panel can ask the full workbench to open one section. The
              // request is consumed once by NovelApp when it next mounts.
              if (target) writePendingView({ ...target })
              const layout = ctx.get('layout')
              if (layout && typeof layout.selectPanel === 'function') layout.selectPanel('novel-workbench')
            },
          }),
        }, NovelSidebarPanel))
        ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab.title',
          key: NOVEL_PANEL_ID,
          locale: NS,
          inject: () => ({ t }),
        }, PanelTitle))
        ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
          name: 'conversation.session.header.utilities',
          id: 'novel-panel',
          order: -6,
          label: () => t('panel.tabTitle'),
          locale: NS,
          inject: (sessionId) => ({
            t,
            sessionId,
            open: () => {
              const sidebar = ctx.get('sidebarRight')
              if (!sidebar || typeof sidebar.openTab !== 'function') return
              try {
                sidebar.openTab(NOVEL_PANEL_KIND)
              } catch (error) {
                console.warn('novel panel open failed', error)
              }
            },
          }),
        }, NovelPanelButton))
      },
    }
  },
})
