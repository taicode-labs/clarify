import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { useMDXComponents } from '../mdx/components'
import { h1, wrapper } from '../mdx/primitives'

import { AccordionGroup } from './AccordionGroup'
import { Collapse } from './Collapse'
import { FileTree, FileTreeItem } from './FileTree'
import { Image } from './Image'
import { Tooltip } from './Tooltip'

describe('content components', () => {
  it('keeps page headings independent from page actions', () => {
    const html = renderToStaticMarkup(
      wrapper({
        children: [
          h1({ children: 'Page title' }),
          h1({ children: 'Unexpected second title' }),
        ],
      }),
    )

    expect(html).not.toContain('clarify-page-title-row')
    expect(html.match(/class="clarify-page-title/g)).toHaveLength(2)
  })

  it('renders a page without a heading', () => {
    const html = renderToStaticMarkup(wrapper({ children: <p>Page content</p> }))

    expect(html).toContain('Page content')
    expect(html).toContain('clarify-mdx-page')
  })

  it('renders grouped collapses as one surface', () => {
    const html = renderToStaticMarkup(
      <AccordionGroup>
        <Collapse title="First" defaultOpen>First answer</Collapse>
        <Collapse title="Second">Second answer</Collapse>
      </AccordionGroup>,
    )

    expect(html).toContain('clarify-accordion-group')
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('aria-expanded="false"')
  })

  it('renders a semantic nested file tree', () => {
    const html = renderToStaticMarkup(
      <FileTree aria-label="Project files">
        <FileTreeItem name="source" type="folder">
          <FileTreeItem name="index.mdx" />
        </FileTreeItem>
      </FileTree>,
    )

    expect(html).toContain('role="tree"')
    expect(html).toContain('role="treeitem"')
    expect(html).toContain('role="group"')
  })

  it('renders the built-in image as a figure with an optional caption', () => {
    const html = renderToStaticMarkup(
      <Image src="/overview.png" alt="Overview" caption="Project overview" loading="lazy" />,
    )

    expect(html).toContain('<figure')
    expect(html).toContain('<figcaption')
    expect(html).toContain('alt="Overview"')
    expect(html).toContain('loading="lazy"')
  })

  it('associates tooltip content with a keyboard-focusable trigger', () => {
    const html = renderToStaticMarkup(<Tooltip content="Application programming interface">API</Tooltip>)

    expect(html).toContain('<button type="button"')
    expect(html).toContain('aria-describedby=')
    expect(html).toContain('role="tooltip"')
    expect(html).toContain('popover="manual"')
    expect(html).toContain('fixed')
  })

  it('registers all content components in MDX', () => {
    const components = useMDXComponents()

    expect(components.AccordionGroup).toBe(AccordionGroup)
    expect(components.FileTree).toBe(FileTree)
    expect(components.FileTreeItem).toBe(FileTreeItem)
    expect(components.img).toBe(Image)
    expect(components).not.toHaveProperty('Figure')
    expect(components).not.toHaveProperty('Markdown')
    expect(components.Tooltip).toBe(Tooltip)
  })
})
