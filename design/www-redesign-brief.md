# Clarify 官网重设计调研与设计文档

> 目标：参考 Redocly 官网的信息组织、产品叙事节奏和互动展示方式，生成一套属于 Clarify 的原创官网设计方案。本文只提炼公开网站的设计模式，不复制其文案、图像、品牌资产或专有表达。

## 1. 背景

Clarify 当前定位是面向 MDX、OpenAPI 与 AI-ready knowledge base 的开源文档发布工具。它强调：

- 文档与代码同仓库管理。
- MDX 与 OpenAPI 在同一个站点中发布。
- 静态、自托管、可版本化输出。
- TypeScript 配置与 React Renderer 可组合定制。
- 生成 raw Markdown、OpenAPI artifacts 与 `llms.txt`，默认面向 AI 读取。

当前 `apps/www` 已有基础落地页：Header、Hero、Features、Workflow、ApiPreview、RendererPreview、FinalCta、Footer。新设计应在现有 React + Tailwind 4 + i18n 架构上迭代，不引入重型依赖。

## 2. 参考网站模式总结

Redocly 官网的核心不是单页功能清单，而是“产品成长故事 + 多产品矩阵 + 社会证明 + 协作角色”的叙事结构。

可借鉴的模式：

1. **强势 Hero**
   - 顶部导航清晰区分产品、文档、学习、客户、价格。
   - 首屏用大标题讲使命，而不是只说功能。
   - CTA 同时覆盖“立即试用”和“阅读指南”。
   - 用数据与客户 logo 建立信任。

2. **故事化过渡**
   - 先讲最初解决了什么核心问题。
   - 再讲能力如何扩展成一套完整平台。
   - 通过分段 eyebrow 文案形成节奏。

3. **产品/能力矩阵**
   - 把产品能力拆成几个大卡片，每张卡片都有明确对象、结果、功能亮点和视觉预览。
   - 视觉上大量使用横向大卡、嵌套小卡、产品 UI 截图感组件。

4. **使用者与团队角色**
   - 面向 Developers、Executives、Product Managers、Technical Writers 等角色描述收益。
   - 角色区块比纯功能区块更容易转化。

5. **社会证明**
   - 指标、客户 logo、故事、案例形成连续可信度。
   - 对 Clarify 初期可用 GitHub stars、npm downloads、build 输出能力、开源协议、技术栈透明度替代客户背书。

6. **底部强 CTA**
   - 页面末尾回到一个清晰行动：开始构建、阅读指南、查看 GitHub。

不应照搬的内容：

- Redocly 的产品命名、文案句式、客户 logo、人物评价、图像资源。
- 其蓝色品牌主视觉和网站特有装饰线条。
- 其商业化试用转化路径。

## 3. Clarify 的差异化叙事

Clarify 不应被包装成 Redocly 的替代品，而应突出自己的开源、代码所有权与静态发布优势。

建议主叙事：

> Build documentation systems that stay close to your code.

中文主叙事：

> 让文档系统和代码一起演进。

核心差异：

| 维度 | Redocly 类平台启发 | Clarify 原创定位 |
| --- | --- | --- |
| 产品性质 | API 文档与平台化工具 | 开源、自托管、代码仓库内的文档发布引擎 |
| 主要受众 | API 平台团队、企业文档团队 | 开源项目、基础设施团队、产品工程团队、AI 工具团队 |
| 转化目标 | 试用 / 销售线索 | 安装 CLI、阅读文档、Star GitHub、采纳到仓库 |
| 视觉语气 | 企业 SaaS、强品牌故事 | Developer-first、清晰、轻量、可组合 |
| 核心资产 | 平台产品矩阵 | MDX + OpenAPI + Renderer + SSG + AI-readable artifacts |

## 4. 新官网信息架构

建议首页结构从当前“功能平铺”升级为“叙事型产品页”。

### 4.1 Header

导航建议：

- Product：页面内锚点，指向能力矩阵。
- Workflow：写作、配置、构建、部署流程。
- OpenAPI：API Reference 能力。
- AI-ready：新增卖点区块。
- Docs：跳转 `apps/docs`。
- GitHub：外链。

CTA：

- Primary：Get started / 开始使用。
- Secondary：GitHub 或 View demo，可根据语言显示。

设计：

- 保持 sticky + blur。
- Logo 左侧，导航居中，语言/主题/CTA 右侧。
- 桌面端增加轻量 dropdown 的视觉暗示即可，第一阶段不必实现复杂菜单。

### 4.2 Hero：使命 + 产品预览 + 信任指标

目标：让用户在 5 秒内知道 Clarify 是什么、适合谁、为什么可信。

内容建议：

- Badge：Open-source docs publishing for MDX, OpenAPI, and AI agents.
- H1：Documentation that ships with your code.
- 中文 H1：和代码一起发布的现代文档系统。
- 描述：强调本地 CLI、TypeScript 配置、React Renderer、静态输出。
- CTA：Start with CLI、Explore docs、Star on GitHub。

视觉建议：

- 左侧文案，右侧大型产品窗口。
- 产品窗口不是普通代码块，而是三栏“内容源 → Clarify 构建 → 发布站点”的组合界面。
- 在预览中展示：
  - `source/guides/getting-started.mdx`
  - `openapi/api.openapi.json`
  - `clarify.ts`
  - 生成结果：HTML、raw `.md`、`llms.txt`

指标区建议：

- `MDX + OpenAPI` unified pipeline
- `Static output` deploy anywhere
- `TypeScript config` typed by default
- `AI-readable` raw artifacts

若需要动态数据，后续可接入 npm/GitHub；第一阶段用能力指标替代夸张数字。

### 4.3 Origin Story：先解决最痛的问题

参考 Redocly 的“First we built”节奏，但换成 Clarify 的原创故事。

区块标题：

- 英文：First, we made docs local again.
- 中文：第一步，让文档回到代码仓库。

内容要点：

- 不想为了漂亮文档牺牲源码所有权。
- 不想在 README、API Reference、AI 知识库之间维护多套内容。
- Clarify 将 MDX、OpenAPI 和构建配置收敛进一个本地工作流。

视觉：

- 左侧“problem stack”：Hosted lock-in、Manual API pages、Disconnected AI docs。
- 右侧“Clarify stack”：MDX、OpenAPI、Renderer、Static output、llms.txt。
- 用绿色连接线表示从散乱到清晰。

### 4.4 Capability Realms：能力矩阵

参考多产品卡片结构，但 Clarify 应拆为 4 个能力领域，不使用 Redocly 的产品命名模式。

#### A. Author

面向：技术作者、工程师、开源维护者。

能力：

- MDX-first 页面。
- React components in docs。
- Callouts、cards、code blocks。
- Locale folders。

视觉：MDX 编辑器 + 页面预览分屏。

#### B. Reference

面向：API 团队。

能力：

- OpenAPI 3.0/3.1。
- 自动生成接口页。
- MDX 内嵌 endpoint。
- 参数、响应、示例统一视觉。

视觉：API endpoint card + schema panel。

#### C. Publish

面向：DevOps、平台工程。

能力：

- `clarify dev`。
- `clarify build`。
- static HTML。
- route prefix。
- public assets copy。

视觉：终端 + 构建产物树。

#### D. Enable AI

面向：AI 工具、内部知识库、Agent 工作流。

能力：

- raw Markdown 输出。
- raw OpenAPI artifacts。
- stable raw content links。
- `llms.txt` discovery。

视觉：agent 读取 `llms.txt` 后关联页面和 API spec 的流图。

### 4.5 Product Showcase：这个官网也由 Clarify 思路构建

Redocly 强调自身网站由自家工具构建。Clarify 可以改成：

- 官网使用同一套设计 token、React 组件和 Tailwind 约束。
- 文档站使用 Clarify CLI 与 Renderer。
- 营销页与文档页共享品牌视觉。

区块标题：

- 英文：Built from the same principles.
- 中文：官网和文档使用同一套设计原则。

展示内容：

- Marketing site：Vite + React。
- Docs site：Clarify CLI。
- Renderer package：shared documentation UI。
- Theme tokens：emerald / zinc / radius / typography。

### 4.6 Roles：按团队角色讲收益

角色区块建议：

1. **Developers**
   - 在 IDE 中写文档、同步 API spec、快速本地预览。
2. **Technical Writers**
   - 用 MDX 组织指南、教程、Reference，不拆分系统。
3. **Platform Teams**
   - 自托管静态输出，部署到任意基础设施。
4. **AI Tooling Teams**
   - 让 Agent 读取稳定、结构化、可发现的知识源。

视觉：四列角色卡，卡片顶部使用简洁线性图标，hover 时显示对应 workflow snippet。

### 4.7 Comparison：开源控制权

新增轻量对比区，不点名攻击竞品。

标题：

- 英文：Designed for teams that want ownership.
- 中文：为重视所有权的团队设计。

对比维度：

- Source-owned content。
- Local-first workflow。
- Static deploy target。
- Typed config。
- Composable renderer。
- AI-readable outputs。

### 4.8 Final CTA

文案方向：

- 英文：Start with one MDX page. Grow into a full docs platform.
- 中文：从一个 MDX 页面开始，逐步成长为完整文档平台。

按钮：

- Install Clarify。
- Read the guide。
- Star GitHub。

## 5. 视觉设计方向

### 5.1 色彩

沿用 Clarify 当前主题，不转向 Redocly 蓝色。

主色：

- Emerald：行动、成功、清晰路径。
- Zinc：文本、边框、背景、中性色。
- Lime / Sky：只作为极轻渐变辅助，不做主品牌色。

建议 token：

- Background light：`white`, `zinc-50`。
- Background dark：`zinc-950`, `zinc-900`。
- Primary：`emerald-500`。
- Primary soft：`emerald-50`, `emerald-400/10`。
- Border：`zinc-900/10`, `white/10`。
- Code：`zinc-950`, `black/30`。

### 5.2 排版

- Hero H1：`text-5xl sm:text-6xl lg:text-7xl`，保持当前尺度。
- Section H2：`text-3xl sm:text-5xl`。
- Eyebrow：mono uppercase，letter spacing。
- Body：`text-base` 或 `text-lg`，高行距。

### 5.3 形状与布局

- 大圆角：`rounded-3xl` 用于主视觉容器。
- 中圆角：`rounded-2xl` 用于卡片。
- 卡片阴影克制，靠边框和背景层级建立深度。
- 多使用大块横向 panel，减少碎片化小卡。

### 5.4 装饰语言

原创装饰应围绕 Clarify 的“清晰路径”：

- 细网格背景。
- 绿色路径线。
- 文件树到页面的流线。
- 终端窗口、代码块、API card、raw artifact chip。
- 不使用 Redocly 的客户 logo 墙样式和蓝色曲线资产。

## 6. 动效与交互

第一阶段建议只做 CSS 级交互，避免复杂动画依赖。

- Header：滚动时保持 blur 与边框。
- Hero preview：卡片 hover 时轻微上移、边框 emerald。
- Capability cards：hover 显示更多细节或改变预览 tab。
- Product matrix：桌面端可做 sticky visual，左侧滚动内容右侧预览变化；移动端退化为纵向卡片。
- CTA：按钮箭头轻微右移。
- 背景：渐变 blob 不移动或极慢 CSS animation，注意无障碍与性能。

## 7. 内容草案

### Hero

英文：

- Badge：Open-source documentation publishing for MDX, OpenAPI, and AI agents.
- H1：Documentation that ships with your code.
- Description：Clarify turns MDX pages, OpenAPI specs, and typed configuration into a fast static documentation site your team can own, customize, and feed to AI tools.
- Primary CTA：Start with Clarify
- Secondary CTA：Explore the docs
- Text CTA：Star on GitHub

中文：

- Badge：面向 MDX、OpenAPI 与 AI Agent 的开源文档发布工具。
- H1：和代码一起发布的现代文档系统。
- Description：Clarify 将 MDX 页面、OpenAPI 规范和类型化配置构建为快速、可自托管、可定制且适合 AI 读取的静态文档站点。
- Primary CTA：开始使用 Clarify
- Secondary CTA：浏览文档
- Text CTA：在 GitHub 查看

### Story

中文标题：第一步，让文档回到代码仓库。

中文描述：你的产品指南、API Reference 和 AI 知识源不应该被拆成三套系统。Clarify 用一个本地优先的工作流连接内容、配置、渲染与发布。

### Capabilities

- Author：用 MDX 写作，用 React 扩展。
- Reference：从 OpenAPI 生成一致的 API Reference。
- Publish：构建可部署到任意平台的静态输出。
- Enable AI：默认产出 Agent 可发现、可读取的知识文件。

## 8. 组件落地建议

基于当前 `apps/www/source/components`，建议新增或重构：

| 组件 | 操作 | 说明 |
| --- | --- | --- |
| `Hero.tsx` | 重构 | 改成使命文案 + pipeline preview + trust chips |
| `Features.tsx` | 重构/替换 | 从 6 个小功能卡变为 4 个大能力领域 |
| `Story.tsx` | 新增 | 承接 Hero，讲 Clarify 起点与差异 |
| `CapabilityMatrix.tsx` | 新增 | Author / Reference / Publish / Enable AI |
| `AiReady.tsx` | 新增 | 单独强调 `llms.txt` 与 raw artifacts |
| `Roles.tsx` | 新增 | 面向不同团队角色 |
| `Ownership.tsx` | 新增 | 开源控制权对比 |
| `ProductShowcase.tsx` | 新增 | 展示官网、文档站、renderer、theme 关系 |
| `FinalCta.tsx` | 重构 | 加强 CLI 安装与 GitHub 转化 |
| `homeData.ts` | 扩展 | 集中维护 cards、roles、metrics、tabs 数据 |
| `i18n.ts` | 扩展 | 新增中英文文案 key |

`App.tsx` 建议顺序：

1. `Header`
2. `Hero`
3. `Story`
4. `CapabilityMatrix`
5. `Workflow`
6. `ApiPreview` 或新的 `ReferencePreview`
7. `AiReady`
8. `ProductShowcase`
9. `Roles`
10. `Ownership`
11. `FinalCta`
12. `Footer`

## 9. 实施计划

### Phase 1：设计与内容重构

- 完成本文档。
- 确定首页模块顺序。
- 补齐中英文 i18n 文案。
- 定义 `homeData.ts` 数据结构。

### Phase 2：页面组件实现

- 重构 `Hero`。
- 新增 `Story`、`CapabilityMatrix`、`AiReady`、`Roles`、`Ownership`。
- 调整现有 `Workflow`、`ApiPreview`、`RendererPreview` 的视觉一致性。

### Phase 3：视觉 polish

- 统一卡片边框、hover、背景渐变。
- 增强暗色模式。
- 移动端布局检查。
- 减少过度装饰，保持加载性能。

### Phase 4：验证

- `pnpm --filter @clarify-labs/www typecheck`。
- `pnpm --filter @clarify-labs/www build`。
- 浏览器检查中英文、暗色模式、响应式。

## 10. 风险与约束

- 避免复制 Redocly 的原文、客户背书、产品命名和视觉资产。
- Clarify 当前还处于早期，不应使用未经验证的夸张指标。
- 首页信息密度会提高，需要控制移动端长度。
- 新组件应保持纯静态、无复杂运行时依赖。
- 所有用户可见文案需同时维护 `zh-CN` 和 `en-US`。

## 11. 成功标准

- 用户首屏能理解 Clarify 是“开源、代码所有权、本地优先”的文档发布工具。
- 页面从功能清单升级为完整产品叙事。
- 视觉仍属于 Clarify：emerald + zinc、代码预览、静态输出、AI-ready artifacts。
- CTA 更明确：安装、阅读文档、查看 GitHub。
- 设计可直接转化为当前 React 组件实现。
