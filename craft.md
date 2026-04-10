# Custom Userscripts 构建设计

## 概述

构建系统将 `configs/` 目录下的配置编译为浏览器可安装的 userscript，通过 CDN 分发。

## 构建产物结构

```
public/
├── style.userscripts.js  # 样式注入脚本（@match 来自 domain.json）
├── domain.json           # 域名 → CSS 文件映射
├── styles/               # 各站点 CSS 文件（按需加载）
│   ├── baidu.css
│   ├── bing.css
│   ├── chatgpt.css
│   ├── github.css
│   ├── google.css
│   └── zhihu.css
└── imgur.userscripts.js  # Imgur 代理脚本（独立）
```

## 脚本运行逻辑

### 加载流程

```
页面加载（@run-at document-start）
    ↓
获取当前 hostname（如 "www.google.com"）
    ↓
GM.xmlHttpRequest 加载 domain.json（带版本号的 CDN 路径）
    ↓
遍历 rules，匹配 hostname 与 match 规则
    ↓
匹配成功 → GM.xmlHttpRequest 加载对应 CSS
    ↓
GM.addStyle 注入样式
```

### 匹配算法

```javascript
function matchesPattern(hostname, pattern) {
    const regex = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
    return new RegExp('^' + regex + '$').test('https://' + hostname + '/');
}
```

**关键行为**：
- `*://domain.com/*` 不匹配子域名（如 `www.domain.com`）
- `*://*.domain.com/*` 不匹配裸域名（需要至少一个子域名字符）

示例：
| hostname | pattern | 匹配 |
|----------|---------|------|
| `baidu.com` | `*://baidu.com/*` | ✅ |
| `www.baidu.com` | `*://baidu.com/*` | ❌ |
| `www.baidu.com` | `*://*.baidu.com/*` | ✅ |
| `github.com` | `*://github.com/*` | ✅ |
| `gist.github.com` | `*://github.com/*` | ❌ |

### domain.json 格式

```json
{
  "rules": [
    {
      "file": "google.css",
      "match": ["*://google.com/*", "*://www.google.com/*"]
    },
    {
      "file": "bing.css",
      "match": ["*://bing.com/*", "*://*.bing.com/*"]
    }
  ]
}
```

## 构建脚本设计

### scripts/build.js

**输入**：
- `configs/domain.json` - 域名规则配置
- `configs/styles/*.css` - 各站点样式文件
- `package.json` - 版本号

**输出**：
- `public/domain.json` - 直接复制
- `public/styles/*.css` - 从 configs/styles/ 复制
- `public/style.userscripts.js` - 生成的样式脚本

### style.userscripts.js 元数据

```javascript
// ==UserScript==
// @name         Custom Styles
// @namespace    https://github.com/flinhong/userscripts
// @version      ${version}
// @description  Apply custom fonts and styles to supported websites
// @author       flinhong
// @match        *://google.com/*
// @match        *://www.google.com/*
// @match        *://*.bing.com/*
// @match        ...
// @updateURL    https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/style.userscripts.js
// @downloadURL  https://cdn.frankindev.com/statically/gh/flinhong/userscripts/public/style.userscripts.js
// @grant        GM.xmlHttpRequest
// @grant        GM.addStyle
// @run-at       document-start
// ==/UserScript==
```

**@match 规则**：从 `domain.json` 的 `rules[].match` 提取所有唯一 pattern，去重后逐行输出。

**@updateURL/@downloadURL**：不带版本号，确保能检测最新版本更新。

### style.userscripts.js 模板结构

```javascript
(function() {
    'use strict';

    const BASE_URL = 'https://cdn.frankindev.com/statically/gh/flinhong/userscripts/@v${version}/public';

    const hostname = window.location.hostname;

    function matchesPattern(hostname, pattern) {
        const regex = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        return new RegExp('^' + regex + '$').test('https://' + hostname + '/');
    }

    function loadCSS(file) {
        GM.xmlHttpRequest({
            method: 'GET',
            url: BASE_URL + '/styles/' + file,
            onload: function(response) {
                GM.addStyle(response.responseText);
            }
        });
    }

    GM.xmlHttpRequest({
        method: 'GET',
        url: BASE_URL + '/domain.json',
        onload: function(response) {
            const config = JSON.parse(response.responseText);
            for (const rule of config.rules) {
                for (const pattern of rule.match) {
                    if (matchesPattern(hostname, pattern)) {
                        loadCSS(rule.file);
                        return;
                    }
                }
            }
        }
    });
})();
```

> **版本号管理**：
> - `@version` 在构建时从 `package.json` 读取并替换
> - CDN 资源路径使用 `@v{version}/public/...` 格式
> - `@updateURL` 不带版本号，用于检测最新版本

## 发布命令

```bash
# 构建
npm run build

# 预览版本变化（不修改文件）
npm run release:preview
npm run release:preview:patch
npm run release:preview:minor
npm run release:preview:major

# 本地发布
npm run release:patch
npm run release:minor
npm run release:major

# CI 发布
npm run release:ci
```

### release:ci 工作流

```bash
standard-version          # 更新 package.json 版本号，创建 tag
    ↓
npm run build            # 构建脚本（注入版本号）
    ↓
git add -A && git commit # 提交构建产物
    ↓
git push origin --follow-tags  # 推送触发 GitHub Actions
```

### GitHub Action 工作流

```yaml
on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - run: git add public/ && git commit -m "chore: build files [skip ci]"
      - run: git push
```

## 开发调试

- 本地构建：`npm run build`
- 构建产物在 `public/` 目录
- 预览版本变化：`npm run release:preview`

## 注意事项

1. **CSP 问题**：所有外部资源（domain.json、CSS）必须通过 `GM.xmlHttpRequest` 加载
2. **性能**：每个页面只加载一个匹配的 CSS，避免加载无用资源
3. **缓存**：依赖 CDN 缓存机制，无需在脚本内做额外缓存
