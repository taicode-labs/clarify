import { Children, cloneElement, isValidElement, useState } from 'react'
import type { ComponentProps, ReactElement, ReactNode } from 'react'

type DialogProps = ComponentProps<'div'>
type DisclosureProps = ComponentProps<'div'>
type CopyableProps = ComponentProps<'span'>
type TabGroupProps = ComponentProps<'div'>
type TabContext = { selectedIndex: number; setSelectedIndex: (index: number) => void }
type TabListProps = ComponentProps<'div'> & { __tabContext?: TabContext }
type TabPanelsProps = ComponentProps<'div'> & { __tabContext?: Pick<TabContext, 'selectedIndex'> }

export function Dialog(arg0: DialogProps) {  const { children, ...props } = arg0

  return <div {...props}>{children}</div>
}

export function DialogPanel(props: ComponentProps<'div'>) {
  return <div {...props} />
}

export function Disclosure(arg0: DisclosureProps) {  const { hidden: _hidden, ...props } = arg0

  return <div {...props} />
}

export function Copyable(arg0: CopyableProps) {  const { children, ...props } = arg0

  return <span {...props}>{children}</span>
}

export function TabGroup(arg0: TabGroupProps) {  const { children, ...props } = arg0

  const [selectedIndex, setSelectedIndex] = useState(0)
  const context = { selectedIndex, setSelectedIndex }

  return <div {...props}>{injectTabContext(children, context)}</div>
}

function injectTabContext(children: ReactNode, context: TabContext): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child
    }

    if (child.type === TabList || child.type === TabPanels) {
      const element = child as ReactElement<{ __tabContext?: typeof context; children?: ReactNode }>

      return cloneElement(element, {
        __tabContext: context,
        children: injectTabContext(element.props.children, context),
      })
    }

    const element = child as ReactElement<{ children?: ReactNode }>

    return cloneElement(element, {
      children: injectTabContext(element.props.children, context),
    })
  })
}

export function TabList(arg0: TabListProps) {  const { children, __tabContext, ...props } = arg0

  return (
    <div {...props}>
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) {
          return child
        }

        const button = child as ReactElement<ComponentProps<'button'>>

        return cloneElement(button, {
          'aria-selected': __tabContext?.selectedIndex === index,
          onClick: (event) => {
            button.props.onClick?.(event)
            __tabContext?.setSelectedIndex(index)
          },
        })
      })}
    </div>
  )
}

export function TabPanels(arg0: TabPanelsProps) {  const { children, __tabContext, ...props } = arg0

  return (
    <div {...props}>
      {Children.map(children, (child, index) => (
        <div hidden={(__tabContext?.selectedIndex ?? 0) !== index}>{child}</div>
      ))}
    </div>
  )
}
