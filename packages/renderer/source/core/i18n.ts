import { useContext } from 'react'

import { ConfigContext, LocaleContext } from './context'

export type BuiltInLocale = 'en' | 'zh-CN'

export type BuiltInTextKey =
  | 'actions.code'
  | 'actions.copy'
  | 'actions.copying'
  | 'actions.copied'
  | 'actions.copyFailed'
  | 'builtWith.label'
  | 'builtWith.prefix'
  | 'callout.danger'
  | 'callout.info'
  | 'callout.note'
  | 'callout.success'
  | 'callout.tip'
  | 'callout.warning'
  | 'contentActions.copyContent'
  | 'contentActions.copyContentDescription'
  | 'contentActions.copyLink'
  | 'contentActions.copyLinkDescription'
  | 'contentActions.copyLlms'
  | 'contentActions.copyLlmsDescription'
  | 'contentActions.copiedLlms'
  | 'contentActions.editPage'
  | 'contentActions.editPageDescription'
  | 'contentActions.copyOptions'
  | 'contentActions.copiedContent'
  | 'contentActions.copiedLink'
  | 'contentActions.viewMarkdown'
  | 'contentActions.viewMarkdownDescription'
  | 'contentActions.viewOpenApi'
  | 'contentActions.viewOpenApiDescription'
  | 'feedback.no'
  | 'feedback.prompt'
  | 'feedback.thanks'
  | 'feedback.yes'
  | 'navigation.documentation'
  | 'navigation.next'
  | 'navigation.previous'
  | 'navigation.previousNext'
  | 'navigation.toggle'
  | 'navbar.home'
  | 'navbar.openLinks'
  | 'navbar.sections'
  | 'notFound.description'
  | 'notFound.home'
  | 'notFound.label'
  | 'notFound.title'
  | 'openapi.apiDocumentation'
  | 'openapi.authentication'
  | 'openapi.bodyProperties'
  | 'openapi.collapse'
  | 'openapi.endpointNotFound'
  | 'openapi.example'
  | 'openapi.expand'
  | 'openapi.headers'
  | 'openapi.language'
  | 'openapi.client'
  | 'openapi.closeRequest'
  | 'openapi.credential'
  | 'openapi.loading'
  | 'openapi.mediaType'
  | 'openapi.none'
  | 'openapi.openApiReference'
  | 'openapi.operationParameter'
  | 'openapi.optional'
  | 'openapi.parameter'
  | 'openapi.pathParameters'
  | 'openapi.queryParameters'
  | 'openapi.request'
  | 'openapi.requestBody'
  | 'openapi.requestBodyEmpty'
  | 'openapi.requestCorsHint'
  | 'openapi.responseBodyProperties'
  | 'openapi.required'
  | 'openapi.requiredBadge'
  | 'openapi.response'
  | 'openapi.responseBodyEmpty'
  | 'openapi.responseEmpty'
  | 'openapi.responses'
  | 'openapi.schemaExample'
  | 'openapi.sendRequest'
  | 'openapi.sendingRequest'
  | 'openapi.server'
  | 'openapi.scrollExamplesLeft'
  | 'openapi.scrollExamplesRight'
  | 'openapi.specNotFound'
  | 'openapi.specPathMissing'
  | 'openapi.status'
  | 'openapi.tryRequest'
  | 'openapi.version'
  | 'openapi.webhookResponse'
  | 'openapi.webhookResponses'
  | 'search.button'
  | 'search.noResults'
  | 'search.placeholder'
  | 'search.shortcutCtrl'
  | 'renderError.componentStack'
  | 'renderError.description'
  | 'renderError.details'
  | 'renderError.message'
  | 'renderError.path'
  | 'renderError.reload'
  | 'renderError.stack'
  | 'renderError.title'
  | 'renderError.version'
  | 'renderError.type'
  | 'theme.switchToDark'
  | 'theme.switchToLight'
  | 'theme.switchToSystem'
  | 'language.switch'
  | 'mermaid.zoomIn'
  | 'mermaid.zoomOut'
  | 'mermaid.resetZoom'
  | 'mermaid.renderError'
  | 'mermaid.scrollHint'

const builtInText = {
  en: {
    'actions.code': 'Code',
    'actions.copy': 'Copy',
    'actions.copying': 'Copying...',
    'actions.copied': 'Copied!',
    'actions.copyFailed': 'Copy failed',
    'builtWith.label': 'Built with Clarify',
    'builtWith.prefix': 'Built with',
    'callout.danger': 'Danger',
    'callout.info': 'Info',
    'callout.note': 'Note',
    'callout.success': 'Success',
    'callout.tip': 'Tip',
    'callout.warning': 'Warning',
    'contentActions.copyContent': 'Copy page',
    'contentActions.copyContentDescription': 'Copy this page as {contentType} for LLMs',
    'contentActions.copyLink': 'Copy {contentType} link',
    'contentActions.copyLinkDescription': 'Copy the raw {contentType} content link for this page',
    'contentActions.copyLlms': 'Copy llms.txt',
    'contentActions.copyLlmsDescription': 'Copy the llms.txt link for this site',
    'contentActions.copiedLlms': 'Copied llms.txt',
    'contentActions.editPage': 'Edit this page',
    'contentActions.editPageDescription': 'Open the source file for this page',
    'contentActions.copyOptions': 'Choose copy option',
    'contentActions.copiedContent': 'Copied page',
    'contentActions.copiedLink': 'Copied link',
    'contentActions.viewMarkdown': 'View as Markdown',
    'contentActions.viewMarkdownDescription': 'View this page as plain text',
    'contentActions.viewOpenApi': 'View raw OpenAPI',
    'contentActions.viewOpenApiDescription': 'Open the API description file in a new tab',
    'feedback.no': 'No',
    'feedback.prompt': 'Was this page helpful?',
    'feedback.thanks': 'Thanks for your feedback!',
    'feedback.yes': 'Yes',
    'navigation.documentation': 'Documentation',
    'navigation.next': 'Next',
    'navigation.previous': 'Previous',
    'navigation.previousNext': 'Previous and next pages',
    'navigation.toggle': 'Toggle navigation',
    'navbar.home': 'Home',
    'navbar.openLinks': 'Open navigation links',
    'navbar.sections': 'Documentation sections',
    'notFound.description': 'The page may have moved, been renamed, or never existed. Check the address or return to the homepage.',
    'notFound.home': 'Back to homepage',
    'notFound.label': '404',
    'notFound.title': 'Page not found',
    'openapi.apiDocumentation': 'API Documentation',
    'openapi.authentication': 'Authentication',
    'openapi.bodyProperties': 'Body properties',
    'openapi.collapse': 'Collapse',
    'openapi.endpointNotFound': 'Endpoint not found: {endpoint}',
    'openapi.example': 'Example',
    'openapi.expand': 'Expand',
    'openapi.headers': 'Headers',
    'openapi.language': 'Language',
    'openapi.client': 'Client',
    'openapi.closeRequest': 'Close request tester',
    'openapi.credential': 'Credential',
    'openapi.loading': 'Loading OpenAPI spec...',
    'openapi.mediaType': 'Media type',
    'openapi.none': 'None',
    'openapi.openApiReference': 'OpenAPI Reference',
    'openapi.operationParameter': 'Operation parameter.',
    'openapi.optional': 'Optional.',
    'openapi.parameter': 'parameter',
    'openapi.pathParameters': 'Path parameters',
    'openapi.queryParameters': 'Query parameters',
    'openapi.request': 'Request',
    'openapi.requestBody': 'Request body',
    'openapi.requestBodyEmpty': 'No request body',
    'openapi.requestCorsHint': 'The API may be unavailable from this browser because of its network or CORS policy',
    'openapi.responseBodyProperties': 'Response body properties',
    'openapi.required': 'Required.',
    'openapi.requiredBadge': 'required',
    'openapi.response': 'Response',
    'openapi.responseBodyEmpty': 'The response body is empty.',
    'openapi.responseEmpty': 'Send the request to inspect the response.',
    'openapi.responses': 'Responses',
    'openapi.schemaExample': 'Schema example',
    'openapi.sendRequest': 'Send',
    'openapi.sendingRequest': 'Sending',
    'openapi.server': 'Server',
    'openapi.scrollExamplesLeft': 'Scroll examples left',
    'openapi.scrollExamplesRight': 'Scroll examples right',
    'openapi.specNotFound': 'OpenAPI spec not found: {specPath}',
    'openapi.specPathMissing': 'spec or specPath was not provided',
    'openapi.status': 'Status',
    'openapi.tryRequest': 'Try request',
    'openapi.version': 'Version {version}',
    'openapi.webhookResponse': 'Webhook response',
    'openapi.webhookResponses': 'Webhook responses',
    'search.button': 'Search...',
    'search.noResults': 'Nothing found for {query}.',
    'search.placeholder': 'Find something...',
    'search.shortcutCtrl': 'Ctrl ',
    'renderError.componentStack': 'React component stack',
    'renderError.description': 'Clarify stopped rendering this route to keep the rest of the shell responsive. Review the diagnostics below, fix the page source, then reload the route.',
    'renderError.details': 'Runtime diagnostics',
    'renderError.message': 'Message',
    'renderError.path': 'Route',
    'renderError.reload': 'Reload route',
    'renderError.stack': 'JavaScript stack trace',
    'renderError.title': 'Route render failed',
    'renderError.type': 'Error type',
    'renderError.version': 'Clarify version',
    'theme.switchToDark': 'Switch to dark theme',
    'theme.switchToLight': 'Switch to light theme',
    'theme.switchToSystem': 'Follow system theme',
    'language.switch': 'Switch language',
    'mermaid.zoomIn': 'Zoom in',
    'mermaid.zoomOut': 'Zoom out',
    'mermaid.resetZoom': 'Reset zoom',
    'mermaid.renderError': 'Mermaid render error',
    'mermaid.scrollHint': 'Click the diagram to enable scroll-to-zoom',
  },
  'zh-CN': {
    'actions.code': '代码',
    'actions.copy': '复制',
    'actions.copying': '正在复制...',
    'actions.copied': '已复制！',
    'actions.copyFailed': '复制失败',
    'builtWith.label': '由 Clarify 构建',
    'builtWith.prefix': '构建来自',
    'callout.danger': '危险',
    'callout.info': '信息',
    'callout.note': '注意',
    'callout.success': '成功',
    'callout.tip': '提示',
    'callout.warning': '警告',
    'contentActions.copyContent': '复制页面',
    'contentActions.copyContentDescription': '将页面以 {contentType} 格式复制给 LLMs',
    'contentActions.copyLink': '复制 {contentType} 链接',
    'contentActions.copyLinkDescription': '复制当前页面的 {contentType} 原始内容链接',
    'contentActions.copyLlms': '复制 llms.txt',
    'contentActions.copyLlmsDescription': '复制此站点的 llms.txt 链接',
    'contentActions.copiedLlms': '已复制 llms.txt',
    'contentActions.editPage': '编辑此页面',
    'contentActions.editPageDescription': '打开当前页面的源文件',
    'contentActions.copyOptions': '选择复制选项',
    'contentActions.copiedContent': '已复制页面',
    'contentActions.copiedLink': '已复制链接',
    'contentActions.viewMarkdown': '以 Markdown 格式查看',
    'contentActions.viewMarkdownDescription': '以纯文本查看此页面',
    'contentActions.viewOpenApi': '查看 OpenAPI 原始内容',
    'contentActions.viewOpenApiDescription': '在新标签页打开 API 描述文件',
    'feedback.no': '否',
    'feedback.prompt': '这个页面有帮助吗？',
    'feedback.thanks': '感谢你的反馈！',
    'feedback.yes': '是',
    'navigation.documentation': '文档',
    'navigation.next': '下一页',
    'navigation.previous': '上一页',
    'navigation.previousNext': '上一页和下一页',
    'navigation.toggle': '切换导航',
    'navbar.home': '首页',
    'navbar.openLinks': '打开导航链接',
    'navbar.sections': '文档栏目',
    'notFound.description': '页面可能已移动、重命名或不存在。请检查地址，或返回首页继续浏览。',
    'notFound.home': '返回首页',
    'notFound.label': '404',
    'notFound.title': '页面未找到',
    'openapi.apiDocumentation': 'API 文档',
    'openapi.authentication': '认证方式',
    'openapi.bodyProperties': '请求体属性',
    'openapi.collapse': '收起',
    'openapi.endpointNotFound': '未找到端点：{endpoint}',
    'openapi.example': '示例',
    'openapi.expand': '展开',
    'openapi.headers': '请求头',
    'openapi.language': '语言',
    'openapi.client': '客户端',
    'openapi.closeRequest': '关闭请求测试器',
    'openapi.credential': '认证凭证',
    'openapi.loading': '正在加载 OpenAPI 描述文件...',
    'openapi.mediaType': '媒体类型',
    'openapi.none': '无',
    'openapi.openApiReference': 'OpenAPI 参考',
    'openapi.operationParameter': '操作参数。',
    'openapi.optional': '可选。',
    'openapi.parameter': '参数',
    'openapi.pathParameters': '路径参数',
    'openapi.queryParameters': '查询参数',
    'openapi.request': '请求',
    'openapi.requestBody': '请求体',
    'openapi.requestBodyEmpty': '暂无请求体',
    'openapi.requestCorsHint': '受目标 API 的网络或 CORS 策略影响，浏览器可能无法直接访问',
    'openapi.responseBodyProperties': '响应体属性',
    'openapi.required': '必填。',
    'openapi.requiredBadge': '必填',
    'openapi.response': '响应',
    'openapi.responseBodyEmpty': '响应体为空。',
    'openapi.responseEmpty': '发送请求后在这里查看响应。',
    'openapi.responses': '响应',
    'openapi.schemaExample': 'Schema 示例',
    'openapi.sendRequest': '发送',
    'openapi.sendingRequest': '发送中',
    'openapi.server': '服务地址',
    'openapi.scrollExamplesLeft': '向左滚动示例',
    'openapi.scrollExamplesRight': '向右滚动示例',
    'openapi.specNotFound': '未找到 OpenAPI 描述文件：{specPath}',
    'openapi.specPathMissing': '未提供 spec 或 specPath',
    'openapi.status': '状态',
    'openapi.tryRequest': '发起测试请求',
    'openapi.version': '版本 {version}',
    'openapi.webhookResponse': 'Webhook 响应',
    'openapi.webhookResponses': 'Webhook 响应',
    'search.button': '搜索...',
    'search.noResults': '没有找到与 {query} 相关的结果。',
    'search.placeholder': '搜索内容...',
    'search.shortcutCtrl': 'Ctrl ',
    'renderError.componentStack': 'React 组件栈',
    'renderError.description': 'Clarify 已停止渲染此路由，以保证文档 Shell 仍可响应。请查看下方诊断信息，修复页面源码后重新加载路由。',
    'renderError.details': '运行时诊断',
    'renderError.message': '错误消息',
    'renderError.path': '路由',
    'renderError.reload': '重新加载路由',
    'renderError.stack': 'JavaScript 堆栈',
    'renderError.title': '路由渲染失败',
    'renderError.type': '错误类型',
    'renderError.version': 'Clarify 版本',
    'theme.switchToDark': '切换到深色主题',
    'theme.switchToLight': '切换到浅色主题',
    'theme.switchToSystem': '跟随系统主题',
    'language.switch': '切换语言',
    'mermaid.zoomIn': '放大',
    'mermaid.zoomOut': '缩小',
    'mermaid.resetZoom': '重置缩放',
    'mermaid.renderError': 'Mermaid 渲染错误',
    'mermaid.scrollHint': '点击图表后即可滚轮缩放',
  },
} satisfies Record<BuiltInLocale, Record<BuiltInTextKey, string>>

export function resolveBuiltInLocale(locale?: string): BuiltInLocale {
  return locale === 'zh-CN' || locale?.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}

export function translateBuiltInText(locale: string | undefined, key: BuiltInTextKey, replacements: Record<string, string> = {}): string {
  let value = builtInText[resolveBuiltInLocale(locale)]?.[key] ?? builtInText.en[key]
  for (const [name, replacement] of Object.entries(replacements)) {
    value = value.replaceAll(`{${name}}`, replacement)
  }
  return value
}

export function useBuiltInText(locale?: string) {
  const config = useContext(ConfigContext)
  const currentLocale = useContext(LocaleContext)
  const resolvedLocale = locale ?? currentLocale ?? config?.i18n?.defaultLocale
  return (key: BuiltInTextKey, replacements?: Record<string, string>) => translateBuiltInText(resolvedLocale, key, replacements)
}
