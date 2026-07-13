import clsx from 'clsx'
import { Children, cloneElement, isValidElement, type ComponentPropsWithoutRef, type ReactElement, useState } from 'react'

import type { CollapseProps } from './Collapse'

export type AccordionGroupProps = {
  children?: ReactElement<CollapseProps> | ReactElement<CollapseProps>[]
  multiple?: boolean
} & ComponentPropsWithoutRef<'div'>

export function AccordionGroup(arg0: AccordionGroupProps) {
  const { children, multiple = false, className, ...props } = arg0
  const childArray = Children.toArray(children)
  const [openIndex, setOpenIndex] = useState<number | null>(() => {
    const defaultIndex = childArray.findIndex((child) => isValidElement<CollapseProps>(child) && child.props.defaultOpen)
    return defaultIndex === -1 ? null : defaultIndex
  })

  const items = childArray.map((child, index) => {
    if (!isValidElement<CollapseProps>(child)) return child
    if (multiple) return child

    return cloneElement(child, {
      open: openIndex === index,
      onOpenChange: (open) => {
        child.props.onOpenChange?.(open)
        setOpenIndex(open ? index : null)
      },
    })
  })

  return (
    <div
      className={clsx(
        'clarify-accordion-group my-6 divide-y divide-(--clarify-theme-tokens-colors-border) overflow-hidden rounded-(--clarify-theme-tokens-radius-lg) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) [&_.clarify-collapse]:my-0 [&_.clarify-collapse]:rounded-none [&_.clarify-collapse]:border-0',
        className,
      )}
      {...props}
    >
      {items}
    </div>
  )
}
