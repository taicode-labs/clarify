import { type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'

import { a as MarkdownLink, code as MarkdownCode, pre as MarkdownPre } from './primitives'
import { markdownRemarkPlugins } from './remark'

const markdownComponents: Components = {
  a(props) {
    return <MarkdownLink {...props} />
  },
  code(props) {
    return <MarkdownCode {...props} />
  },
  pre(arg0) {    const { children, ...props } = arg0

    return <MarkdownPre {...props}>{children}</MarkdownPre>
  },
}

export function Markdown(arg0: { children?: string; className?: string }): ReactNode {
  const { children, className } = arg0

  if (!children) return null

  return (
    <div className={className}>
      <ReactMarkdown components={markdownComponents} remarkPlugins={markdownRemarkPlugins}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
