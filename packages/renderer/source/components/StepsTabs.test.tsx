import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { useMDXComponents } from '../mdx/components'

import { Step, Steps } from './Steps'
import { TabItem, Tabs } from './Tabs'

describe('Steps', () => {
  it('renders an ordered list with titled steps', () => {
    const html = renderToStaticMarkup(
      <Steps aria-label="Setup">
        <Step title="Install">Run the installer.</Step>
        <Step>Verify the output.</Step>
      </Steps>,
    )

    expect(html).toContain('<ol')
    expect(html).toContain('aria-label="Setup"')
    expect(html).toContain('Install')
    expect(html).toContain('Run the installer.')
  })
})

describe('Tabs', () => {
  it('renders declarative Tab children with accessible tab roles', () => {
    const html = renderToStaticMarkup(
      <Tabs defaultValue="npm">
        <TabItem title="pnpm" value="pnpm">pnpm add clarify</TabItem>
        <TabItem title="npm" value="npm">npm install clarify</TabItem>
      </Tabs>,
    )

    expect(html).toContain('role="tablist"')
    expect(html).toContain('role="tab"')
    expect(html).toContain('aria-selected="true"')
    expect(html).toContain('npm install clarify')
  })

  it('registers Steps and Tabs as built-in MDX components', () => {
    const components = useMDXComponents()

    expect(components.Steps).toBe(Steps)
    expect(components.Step).toBe(Step)
    expect(components.Tabs).toBe(Tabs)
    expect(components.Tab).toBe(TabItem)
  })
})
