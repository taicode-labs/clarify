# Clarify Configuration — Layered Design

Clarify 使用 **两个配置层**，界限清晰。本文档定义了每一层的归属、原因以及它们如何交互。

> **当前为 Phase 1（最小可用配置）。高级功能（i18n、搜索、自定义组件等）将在 Phase 2 引入。**

---

## 黄金法则

| 层级 | 受众 | 文件 | 关注点 |
|------|------|------|--------|
| **项目配置** | 内容作者、文档撰写者 | `clarify.json` | 网站*展示*什么内容 |
| **插件配置** | 前端开发者、构建工程师 | `vite.config.ts` | 网站*如何*构建和运行 |

> **内容创作者不应触碰 `vite.config.ts`。开发者不应频繁修改 `clarify.json`。**

---

## 1. `clarify.json` — 项目配置

`clarify.json` 位于文档项目的根目录（与 `vite.config.ts` 同级）。它是**面向作者**的配置文件。类似于 Mintlify 的 `docs.json` 或 Jekyll 的 `_config.yml`。

### Phase 1 支持的字段

| 字段 | 说明 |
|------|------|
| `title` | 站点标题。作者经常修改。 |
| `description` | 站点描述，用于 SEO。 |
| `logo` | 品牌 Logo 路径。 |
| `routeBase` | 站点的 base URL。可被插件配置覆盖。默认 `'/'`。 |
| `theme` | 主题配置（Phase 1 仅支持 `primary` 颜色）。 |

### 示例

```json
{
  "title": "Clarify Docs",
  "description": "Open-source documentation publishing for MDX and OpenAPI.",
  "logo": "/logo.svg",
  "theme": {
    "primary": "#0ea5e9"
  }
}
```

### Phase 2 将支持的字段

以下字段已设计，但将在后续版本中实现：

- `openApi`（OpenAPI 规范路径）
- `favicon`、`socialPreview`
- `locales`（国际化）
- `nav`（导航结构）
- `footer`、`social`
- `hideEditLink`、`githubRepo`、`githubBranch`

---

## 2. Vite 插件选项 — 构建配置

插件选项位于 `vite.config.ts` 中，作为 `clarifyPlugin()` 的参数。它们**面向开发者**，控制构建时行为。

### Phase 1 支持的字段

| 字段 | 说明 |
|------|------|
| `docsRoot` | 内容文件的根目录。默认 `'source/content'`。 |
| `routeBase` | 部署路径，覆盖 `clarify.json` 中的设置。默认 `'/'`。 |
| `outPath` | 构建输出目录。覆盖 Vite 的 `build.outDir`。默认 `'dist'`。 |
| `include` | MDX 处理的自定义包含规则。 |
| `exclude` | MDX 处理的自定义排除规则。 |
| `plugins` | Clarify 插件扩展数组，用于注册翻译、搜索等扩展插件。 |

### 示例

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { clarifyPlugin } from '@clarify/vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    clarifyPlugin({
      docsRoot: 'source/content',
      routeBase: '/',
      outPath: 'dist',
    }),
  ],
});
```

### Phase 2 将支持的字段

- `components`（自定义 MDX 组件）
- `transformFrontmatter`（前置元数据转换）
- `mdxPlugins`（remark/rehype 插件）
- `searchOptions`（搜索配置）

---

## 3. 优先级与解析顺序

当配置字段在**两层**都存在时，插件遵循以下解析顺序：

```
vite.config.ts (插件选项) > clarify.json > 默认值
```

这允许开发者在不修改 `clarify.json` 的情况下覆盖作者设置。

### 示例：`routeBase` 覆盖

```json
// clarify.json
{ "routeBase": "/docs/" }
```

```typescript
// vite.config.ts
clarifyPlugin({
  routeBase: '/staging/docs/', // 覆盖 clarify.json 以适配 staging 构建
});
```

---

## 4. 内部解析流程

```
构建开始
    │
    ├─ 加载 clarify.json（如果存在）
    │
    ├─ 加载 vite.config.ts → clarifyPlugin(options)
    │
    ├─ 合并：插件选项（最高优先级） + clarify.json + 默认值
    │
    ▼
ResolvedClarifyOptions
    │
    ├─ 生成 virtual:clarify-config（合并后的配置，用于运行时）
    ├─ 生成 virtual:clarify-routes（基于 docsRoot）
    ├─ 生成 virtual:clarify-openapi（如果配置了 openApi）
    └─ 生成搜索索引（Phase 2）
```

---

## 5. 从 Mintlify 迁移

Mintlify 用户拥有 `docs.json` 文件。Clarify 的 `clarify.json` 设计为对常见字段**兼容 Mintlify**。

| Mintlify `docs.json` | Clarify `clarify.json` | 说明 |
|----------------------|------------------------|------|
| `name` | `title` | 用途相同 |
| `description` | `description` | 直接匹配 |
| `logo` | `logo` | 直接匹配 |
| `colors` | `theme` | `colors.primary` → `theme.primary` |

未知的 Mintlify 字段将被接受并忽略（附带警告）。这提供了一条快速的迁移路径。

---

## 6. 验证

插件在构建时验证两层配置：

```typescript
type ConfigError = {
  file: 'clarify.json' | 'vite.config.ts';
  field: string;
  message: string;
  severity: 'error' | 'warning';
};
```

- **错误**：无效的 `routeBase`（未以 `/` 开头）、`docsRoot` 路径不存在、`nav` 结构格式错误。
- **警告**：`clarify.json` 中的未知字段、已弃用的字段名、`openApi` 文件未找到。

验证结果将输出到控制台，并在开发期间通过 Vite 的错误覆盖层显示。

---

## 7. 总结

| 如果内容作者问... | 答案在 |
|------------------|--------|
| "如何修改网站标题？" | `clarify.json` |
| "如何更改主题颜色？" | `clarify.json` |

| 如果开发者问... | 答案在 |
|----------------|---------|
| "如何更改内容目录？" | `vite.config.ts` |
| "如何为 staging 覆盖 base？" | `vite.config.ts` |
| "如何添加自定义 MDX 组件？" | `vite.config.ts`（Phase 2） |
