import { evaluate } from '@mdx-js/mdx'
import { Fragment, cache, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import * as jsxRuntime from 'react/jsx-runtime'

import { Mermaid } from '../components/Mermaid'

import { useMDXComponents } from './components'
import { a as MarkdownLink, code as MarkdownCode, pre as MarkdownPre } from './primitives'
import { markdownRemarkPlugins, mdxRemarkPlugins } from './remark'

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
      <ReactMarkdown components={markdownComponents} remarkPlugins={markdownRemarkPlugins}>
        {children}
      </ReactMarkdown>
    </div>
  )
}

type MdxMarkdownProps = { children?: string; className?: string }

type EvaluatedMdxModule = {
  default: (props: { components?: Record<string, unknown> }) => ReactNode
}

const evaluateMdxModule = cache(async (source: string): Promise<EvaluatedMdxModule> => {
  const evaluated = await evaluate(source, {
    ...jsxRuntime,
    Fragment,
    remarkPlugins: mdxRemarkPlugins,
  })

  return evaluated as EvaluatedMdxModule
})

export async function MdxMarkdown(arg0: MdxMarkdownProps): Promise<ReactNode> {
  const { children, className } = arg0
  const components = useMDXComponents(markdownComponents) as Record<string, unknown>

  if (!children) return null

  const { default: Content } = await evaluateMdxModule(children)

  return (
    <div className={className}>
      <Content components={components} />
    </div>
  )
}
