import { Children, cloneElement, isValidElement, useState } from 'react'
import type { ComponentProps, ReactElement, ReactNode } from 'react'

export function Dialog({ children, ...props }: ComponentProps<'div'>) {
  return <div {...props}>{children}</div>
}

export function DialogPanel(props: ComponentProps<'div'>) {
  return <div {...props} />
}

export function Disclosure({ hidden: _hidden, ...props }: ComponentProps<'div'>) {
  return <div {...props} />
}

export function Copyable({ children, ...props }: ComponentProps<'span'>) {
  return <span {...props}>{children}</span>
}

export function TabGroup({ children, ...props }: ComponentProps<'div'>) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const context = { selectedIndex, setSelectedIndex }

  return <div {...props}>{injectTabContext(children, context)}</div>
}

function injectTabContext(children: ReactNode, context: { selectedIndex: number; setSelectedIndex: (index: number) => void }): ReactNode {
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

export function TabList({ children, __tabContext, ...props }: ComponentProps<'div'> & { __tabContext?: { selectedIndex: number; setSelectedIndex: (index: number) => void } }) {
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

export function TabPanels({ children, __tabContext, ...props }: ComponentProps<'div'> & { __tabContext?: { selectedIndex: number } }) {
  return (
    <div {...props}>
      {Children.map(children, (child, index) => (
        <div hidden={(__tabContext?.selectedIndex ?? 0) !== index}>{child}</div>
      ))}
    </div>
  )
}
