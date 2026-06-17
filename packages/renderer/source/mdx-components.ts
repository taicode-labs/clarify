import { createElement, type ComponentPropsWithoutRef } from 'react'

import { ApiEndpointCard, DocShell, Heading } from './components'
import { OpenApiPage, ApiEndpoint, OpenApiEndpoint } from './openapi'

type MdxHeadingProps = ComponentPropsWithoutRef<'h2'> & {
  id: string
  tag?: string
  label?: string
  anchor?: boolean
}

export function useMDXComponents() {
  return {
    h2: (props: MdxHeadingProps) => createElement(Heading, { level: 2, ...props }),
    h3: (props: MdxHeadingProps) => createElement(Heading, { level: 3, ...props }),
    OpenApiPage,
    ApiEndpoint,
    OpenApiEndpoint,
    ApiEndpointCard,
    DocShell,
  }
}
