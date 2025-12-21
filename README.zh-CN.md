# 字体自定义用户脚本

一个用于自定义网站字体的用户脚本，使用 CSS 变量和 Google Fonts，并提供系统字体作为后备选项。兼容 Tampermonkey 和 Safari 用户脚本。

## 功能特性

- 使用 CSS 变量轻松自定义字体
- 自动加载 Google Fonts 并以系统字体作为后备
- 支持针对特定网站的配置
- 兼容 Tampermonkey 和 Safari 用户脚本
- 妥善处理内容安全策略 (CSP) 限制
- 基于云端的配置，使用 CDN 加速交付
- 使用加速的 Google Fonts 镜像，在中国地区加载更快
- 通过版本控制系统自动检测 CSS 更新
- 仅在有自定义配置的网站上运行以提高性能

## 项目结构

```
userscripts/
├── README.md
├── README.zh-CN.md
├── dist/
│   ├── tampermonkey.js
│   └── userscripts.js
├── src/
│   └── core.js
├── templates/
│   ├── tampermonkey.headers
│   └── userscripts.headers
├── configs/
│   ├── domain-map.json
│   ├── version.json
│   └── styles/
│       ├── fonts.css
│       ├── default.css
│       ├── github.com.css
│       └── ...
└── package.json
```

## 工作原理

1. 脚本加载包含变量和样式的特定网站 CSS 配置
2. 使用中国镜像自动加载 Google Fonts，提高加载速度
3. 当 Google Fonts 被 CSP 阻止时使用系统字体作为后备
4. 通过版本控制系统确保 CSS 更新被检测和应用
5. 脚本仅在有自定义配置的网站上运行（由匹配模式定义）
6. 使用 jsDelivr CDN 加速配置文件传输

## 开发

构建发行文件：

```bash
npm run build
```

这将在 `dist/` 目录中生成针对 Tampermonkey 和 Safari 用户脚本的优化版本。

## 管理更新

确保用户获得最新的 CSS 更新：

1. 根据需要更新 CSS 文件
2. 运行以下其中一个发布命令来升级版本并重新构建：
   - `npm run release` - 升级补丁版本 (1.0.0 -> 1.0.1)
   - `npm run release:minor` - 升级次版本 (1.0.1 -> 1.1.0)
   - `npm run release:major` - 升级主版本 (1.1.0 -> 2.0.0)
3. 提交并推送更改

用户将在下次页面加载时自动获取更新的 CSS 文件，而无需更新用户脚本本身。

在开发过程中，您可以使用 `npm run build` 来重新构建脚本而不更改版本号。

## 添加新网站

要添加新的网站配置：

1. 在 `configs/domain-map.json` 中添加域名（如果与其他域共享配置）或者
2. 创建 `configs/styles/[domain].css`，其中包含该网站的变量和样式
3. 运行 `npm run build` 更新分发文件中的匹配模式