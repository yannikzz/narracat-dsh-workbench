# Narracat 插件索引

DSH 的「发现」标签页读取一个静态索引 JSON。这里是一份单插件的索引，可以直接托管：

```
market/
├── index.template.json # 索引模板（只有插件名、标题、图标等稳定字段）
├── index.json          # 已生成（1.0.9）；发布后可托管
├── icons/narracat.svg  # 图标（相对索引 URL）
└── update-index.mjs    # 从 template 生成 index.json，回填真实版本与发布时间
```

## 发布后

```sh
node market/update-index.mjs
```

脚本读取 npm registry 的已发布版本清单、发布时间和 `dist-tags`，只保留声明了 `dsh.bundle` 且 `engines.dsh` 有效的版本；`0.0.0-stage` 占位版本和从未发布的模板版本不会进入索引。`index.json` 的 `dist-tags.latest` 来自 registry，目前为 `1.0.9`。**npm publish 成功后再托管 `index.json`**；模板里的版本与时间戳只是占位。

## 托管

把 `market/index.json` 和 `market/icons/` 一起放到任意静态主机，例如 `https://narracat.com/dsh/index.json`。要求 2xx、UTF-8、不经重定向；索引默认上限 128 MiB。

## 用户侧

1. DSH → 插件 → 实验性插件 → 打开**自定义插件索引**；
2. 插件 → **发现** → 添加索引源 → 填索引 URL；
3. 在卡片上确认来源后安装。

DSH 只校验索引格式和 `engines.dsh`，不验证标题、图标或来源。索引是第三方内容，只添加可信来源。

## 官方内置列表

`@deepseek-ai/dsh-official-bundles` 的随附/可选/按需列表编译在 DSH 安装里，改列表要发新版 DSH；第三方没有自助入口。这个索引是官方文档里面向第三方的公开发现渠道（实验性）。
