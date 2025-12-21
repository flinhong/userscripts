# 字体定制用户脚本

一个用于通过 CSS 变量和 Google 字体（以及系统字体作为备用）定制网站字体的用户脚本。兼容 Tampermonkey 和 Userscripts。

## 主要功能

-   **灵活的字体定制：** 使用 CSS 变量和 Google 字体，支持系统字体回退。
-   **CSP 兼容：** 通过配置选择性地为特定网站启用/禁用 Google 字体，避免 CSP 限制。
-   **智能域名匹配：** 自动为基础域名及其子域名生成准确的 `@match` 规则。
-   **站点特定配置：** 精细控制不同网站的样式。
-   **自动更新：** 支持通过 `@updateURL` 和 `@downloadURL` 实现用户脚本的自动更新。

## 实现亮点

-   **统一构建流程：** `build.js` 将所有 CSS 源文件打包成站点专属的 CSS 文件，按需包含 Google 字体。
-   **模块化配置：** `configs/domain-map.json` 采用分组格式管理域名到样式的映射，简化维护。
-   **版本控制：** `release.js` 支持语义化版本递增、设定特定版本及重置，并提供 `--dryrun` 预览功能。

## 如何使用

### 依赖安装

```bash
npm install
```

### 构建脚本

生成用户脚本到 `dist/` 目录：

```bash
npm run build
```

### 版本管理

-   **递增版本：**
    ```bash
    npm run release          # 递增补丁版本
    npm run release:minor    # 递增次版本
    npm run release:major    # 递增主版本
    ```
-   **设定/重置版本：**
    ```bash
    npm run version:set -- <版本号>
    npm run version:reset
    ```
-   **预览变更：**
    在上述命令后添加 `--dryrun`。

### 配置样式

-   编辑 `configs/domain-map.json` 定义域名分组和 `useGoogleFonts` 标志。
-   在 `configs/styles/` 目录中创建或修改 `[样式名].css` 文件。

## 自动更新

用户脚本通过 CDN 上的 `.meta.js` 文件检查更新，并通过 `.js` 文件下载最新版本。