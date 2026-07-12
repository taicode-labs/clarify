import { isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import rehypeRaw from 'rehype-raw'

import { Mermaid } from '../components/Mermaid'

import { a as MarkdownLink, code as MarkdownCode, pre as MarkdownPre } from './primitives'
import { markdownRemarkPlugins } from './remark'

function getMermaidChart(children: ReactNode): string | undefined {
  if (!isValidElement(children)) return undefined

  const props = children.props as { className?: string; children?: ReactNode }
  const className = typeof props.className === 'string' ? props.className : ''
  if (!/\blanguage-mermaid\b/.test(className)) return undefined

  return typeof props.children === 'string' ? props.children : undefined
}

function MarkdownTable(arg0: ComponentPropsWithoutRef<'table'>) {
  const { className, ...props } = arg0
  return (
    <div className="overflow-x-auto">
      <table className={className} {...props} />
    </div>
  )
}

const markdownComponents: Components = {
  a(props) {
    return <MarkdownLink {...props} />
  },
  code(props) {
    return <MarkdownCode {...props} />
  },
  pre(arg0) {    const { children, ...props } = arg0

    const chart = getMermaidChart(children)
    if (chart !== undefined) return <Mermaid chart={chart} />

    return <MarkdownPre {...props}>{children}</MarkdownPre>
  },
  table(props) {
    return <MarkdownTable {...props} />
  },
}

type MarkdownProps = { children?: string; className?: string }

export function Markdown(arg0: MarkdownProps): ReactNode {
  const { children, className } = arg0

  if (!children) return null

  return (
    <div className={className}>
      <ReactMarkdown components={markdownComponents} remarkPlugins={markdownRemarkPlugins} rehypePlugins={[rehypeRaw]}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
