# Custom Web Styler Userscripts

一个跨平台的用户脚本，用于为不同网站应用自定义 CSS 样式。

## 功能特性

- 支持多个网站的样式定制
- 动态加载配置和 CSS 文件
- 自动域名匹配
- 支持 Tampermonkey（Chrome/Firefox）和 Userscripts（Safari）
- 配置更新后无需重新安装脚本

## 安装

### Tampermonkey（Chrome/Firefox）

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展
2. 安装用户脚本：`public/tampermonkey.js`

### Safari（macOS）

1. 安装 [Userscripts](https://github.com/quoid/userscripts) 应用
2. 安装用户脚本：`public/userscripts.js`

## 配置

### 添加新网站

编辑 `configs/domain.json`：

```json
{
  "rules": [
    {
      "css": "github",
      "domains": ["github.com"]
    },
    {
      "css": "example",
      "domains": ["example.com", "www.example.com"]
    }
  ]
}
```

然后创建对应的 CSS 文件 `configs/styles/example.css`：

```css
/* Your custom styles here */
body {
  font-family: 'Your Font', sans-serif;
}
```

### 域名匹配规则

脚本使用**精确匹配**，必须在配置中显式列出所有域名：

| 配置的域名 | 匹配的访问 |
|-----------|-----------|
| `github.com` | `github.com` |
| `www.bing.com` | `www.bing.com` |
| `cn.bing.com` | `cn.bing.com` |

如果需要匹配子域名，需要在配置中明确添加。

## 开发

### 构建脚本

```bash
# 清理并重新构建
npm run build

# 仅清理
npm run clean
```

构建后会生成以下文件：

```
public/
├── domain.jsonp          # 域名配置（JSONP 格式）
├── styles/               # CSS 文件
│   ├── github.css
│   ├── bing.css
│   ├── google.css
│   └── chatgpt.css
├── tampermonkey.js       # Chrome/Firefox 用户脚本
└── userscripts.js        # Safari 用户脚本
```

### 版本管理

```bash
# 发布 patch 版本（1.0.0 → 1.0.1）
npm run release

# 发布 minor 版本（1.0.0 → 1.1.0）
npm run release:minor

# 发布 major 版本（1.0.0 → 2.0.0）
npm run release:major

# 预览版本变更（不实际执行）
npm run release:dryrun

# 重置版本到 1.0.0
npm run version:reset
```

版本更新会自动触发构建，更新 `configs/version.json`、`package.json` 和 `public/` 目录。

### 高级选项

```bash
# 仅更新版本文件，不构建
node scripts/release.js bump patch --no-build

# 仅构建，不更新版本
node scripts/release.js build-only
```

### 设置特定版本

如需设置特定版本，直接编辑以下文件后运行 `npm run build`：
- `configs/version.json`
- `package.json`

## 项目结构

```
userscripts/
├── configs/
│   ├── domain.json       # 域名配置
│   ├── version.json      # 版本号
│   └── styles/           # CSS 样式文件
│       ├── github.css
│       ├── bing.css
│       ├── google.css
│       └── chatgpt.css
├── scripts/
│   ├── build.js          # 构建脚本
│   └── release.js        # 发布脚本
├── public/               # 构建输出（自动生成）
│   ├── domain.jsonp
│   ├── styles/
│   ├── tampermonkey.js
│   └── userscripts.js
├── package.json
└── README.md
```

## 部署到 GitHub Pages

1. 将 `public/` 目录部署到 GitHub Pages
2. 用户安装脚本后，配置更新会自动同步

### 使用 GitHub Actions 自动部署

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

## 工作原理

1. **加载配置**：从 `public/domain.jsonp` 加载域名到 CSS 的映射
2. **域名匹配**：获取当前页面域名，在配置中查找对应的 CSS 文件
3. **加载样式**：从 `public/styles/{cssName}.css` 加载 CSS 内容
4. **应用样式**：将样式注入到页面

### Tampermonkey vs Userscripts

| 特性 | Tampermonkey | Userscripts (Safari) |
|------|-------------|---------------------|
| 加载方式 | `GM_xmlhttpRequest` | `fetch` API |
| CORS 限制 | `@connect *` 绕过 | 可能受限 |
| 跨域请求 | 完全支持 | 依赖浏览器支持 |

## License

ISC
