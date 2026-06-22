import { useContext } from 'react'

import { ClarifyConfigContext, ClarifyLocaleContext } from './context'

export type BuiltInLocale = 'en' | 'zh-CN'

export type BuiltInTextKey =
  | 'actions.code'
  | 'actions.copy'
  | 'actions.copied'
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
  | 'openapi.bodyProperties'
  | 'openapi.collapse'
  | 'openapi.endpointNotFound'
  | 'openapi.example'
  | 'openapi.expand'
  | 'openapi.headers'
  | 'openapi.language'
  | 'openapi.client'
  | 'openapi.mediaType'
  | 'openapi.openApiReference'
  | 'openapi.operationParameter'
  | 'openapi.optional'
  | 'openapi.parameter'
  | 'openapi.pathParameters'
  | 'openapi.queryParameters'
  | 'openapi.request'
  | 'openapi.requestBody'
  | 'openapi.required'
  | 'openapi.requiredBadge'
  | 'openapi.response'
  | 'openapi.responses'
  | 'openapi.schemaExample'
  | 'openapi.scrollExamplesLeft'
  | 'openapi.scrollExamplesRight'
  | 'openapi.specNotFound'
  | 'openapi.specPathMissing'
  | 'openapi.status'
  | 'openapi.version'
  | 'search.button'
  | 'search.noResults'
  | 'search.placeholder'
  | 'search.shortcutCtrl'
  | 'renderError.description'
  | 'renderError.details'
  | 'renderError.path'
  | 'renderError.reload'
  | 'renderError.title'
  | 'theme.switchToDark'
  | 'theme.switchToLight'
  | 'language.switch'

const builtInText = {
  en: {
    'actions.code': 'Code',
    'actions.copy': 'Copy',
    'actions.copied': 'Copied!',
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
    'openapi.bodyProperties': 'Body properties',
    'openapi.collapse': 'Collapse',
    'openapi.endpointNotFound': 'Endpoint not found: {endpoint}',
    'openapi.example': 'Example',
    'openapi.expand': 'Expand',
    'openapi.headers': 'Headers',
    'openapi.language': 'Language',
    'openapi.client': 'Client',
    'openapi.mediaType': 'Media type',
    'openapi.openApiReference': 'OpenAPI Reference',
    'openapi.operationParameter': 'Operation parameter.',
    'openapi.optional': 'Optional.',
    'openapi.parameter': 'parameter',
    'openapi.pathParameters': 'Path parameters',
    'openapi.queryParameters': 'Query parameters',
    'openapi.request': 'Request',
    'openapi.requestBody': 'Request body',
    'openapi.required': 'Required.',
    'openapi.requiredBadge': 'required',
    'openapi.response': 'Response',
    'openapi.responses': 'Responses',
    'openapi.schemaExample': 'Schema example',
    'openapi.scrollExamplesLeft': 'Scroll examples left',
    'openapi.scrollExamplesRight': 'Scroll examples right',
    'openapi.specNotFound': 'OpenAPI spec not found: {specPath}',
    'openapi.specPathMissing': 'spec or specPath was not provided',
    'openapi.status': 'Status',
    'openapi.version': 'Version {version}',
    'search.button': 'Search...',
    'search.noResults': 'Nothing found for {query}.',
    'search.placeholder': 'Find something...',
    'search.shortcutCtrl': 'Ctrl ',
    'renderError.description': 'Clarify could not render this page. Try reloading the page; if the problem persists, check the page source or console output.',
    'renderError.details': 'Error details',
    'renderError.path': 'Path',
    'renderError.reload': 'Reload page',
    'renderError.title': 'This page failed to render',
    'theme.switchToDark': 'Switch to dark theme',
    'theme.switchToLight': 'Switch to light theme',
    'language.switch': 'Switch language',
  },
  'zh-CN': {
    'actions.code': '代码',
    'actions.copy': '复制',
    'actions.copied': '已复制！',
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
    'openapi.bodyProperties': '请求体属性',
    'openapi.collapse': '收起',
    'openapi.endpointNotFound': '未找到端点：{endpoint}',
    'openapi.example': '示例',
    'openapi.expand': '展开',
    'openapi.headers': '请求头',
    'openapi.language': '语言',
    'openapi.client': '客户端',
    'openapi.mediaType': '媒体类型',
    'openapi.openApiReference': 'OpenAPI 参考',
    'openapi.operationParameter': '操作参数。',
    'openapi.optional': '可选。',
    'openapi.parameter': '参数',
    'openapi.pathParameters': '路径参数',
    'openapi.queryParameters': '查询参数',
    'openapi.request': '请求',
    'openapi.requestBody': '请求体',
    'openapi.required': '必填。',
    'openapi.requiredBadge': '必填',
    'openapi.response': '响应',
    'openapi.responses': '响应',
    'openapi.schemaExample': 'Schema 示例',
    'openapi.scrollExamplesLeft': '向左滚动示例',
    'openapi.scrollExamplesRight': '向右滚动示例',
    'openapi.specNotFound': '未找到 OpenAPI 描述文件：{specPath}',
    'openapi.specPathMissing': '未提供 spec 或 specPath',
    'openapi.status': '状态',
    'openapi.version': '版本 {version}',
    'search.button': '搜索...',
    'search.noResults': '没有找到与 {query} 相关的结果。',
    'search.placeholder': '搜索内容...',
    'search.shortcutCtrl': 'Ctrl ',
    'renderError.description': 'Clarify 无法渲染当前页面。请尝试刷新；如果问题仍然存在，请检查页面源码或控制台输出。',
    'renderError.details': '错误详情',
    'renderError.path': '路径',
    'renderError.reload': '刷新页面',
    'renderError.title': '页面渲染失败',
    'theme.switchToDark': '切换到深色主题',
    'theme.switchToLight': '切换到浅色主题',
    'language.switch': '切换语言',
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
  const config = useContext(ClarifyConfigContext)
  const currentLocale = useContext(ClarifyLocaleContext)
  const resolvedLocale = locale ?? currentLocale ?? config?.i18n?.defaultLocale
  return (key: BuiltInTextKey, replacements?: Record<string, string>) => translateBuiltInText(resolvedLocale, key, replacements)
}
