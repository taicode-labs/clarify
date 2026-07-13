import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { useMDXComponents } from '../mdx/components'

import { AccordionGroup } from './AccordionGroup'
import { Collapse } from './Collapse'
import { Figure } from './Figure'
import { FileTree, FileTreeItem } from './FileTree'
import { Tooltip } from './Tooltip'

describe('content components', () => {
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

  it('renders an image with an optional caption', () => {
    const html = renderToStaticMarkup(
      <Figure src="/overview.png" alt="Overview" caption="Project overview" />,
    )

    expect(html).toContain('<figure')
    expect(html).toContain('<figcaption')
    expect(html).toContain('alt="Overview"')
  })

  it('associates tooltip content with a keyboard-focusable trigger', () => {
    const html = renderToStaticMarkup(<Tooltip content="Application programming interface">API</Tooltip>)

    expect(html).toContain('tabindex="0"')
    expect(html).toContain('aria-describedby=')
    expect(html).toContain('role="tooltip"')
  })

  it('registers all content components in MDX', () => {
    const components = useMDXComponents()

    expect(components.AccordionGroup).toBe(AccordionGroup)
    expect(components.FileTree).toBe(FileTree)
    expect(components.FileTreeItem).toBe(FileTreeItem)
    expect(components.Figure).toBe(Figure)
    expect(components.Tooltip).toBe(Tooltip)
  })
})
