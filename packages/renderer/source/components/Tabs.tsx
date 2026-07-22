import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Children, isValidElement, useId, useState, type ReactElement, type ReactNode } from 'react'

export type TabItem = {
  id: string
  label: ReactNode
  panel: ReactNode
}

export type TabProps = {
  title: ReactNode
  children: ReactNode
  value?: string
}

export function TabItem(_props: TabProps) {
  return null
}

export type TabsProps = {
  items?: TabItem[]
  children?: ReactNode
  defaultValue?: string
  selectedIndex?: number
  onChange?: (index: number) => void
  className?: string
  spacingClassName?: string
  listClassName?: string
  panelsClassName?: string
  actions?: ReactNode
  variant?: 'content' | 'code'
}

type TabClassNameProps = {
  selected: boolean
}

export function Tabs(arg0: TabsProps) {
  const { items, children, defaultValue, selectedIndex, onChange, className, spacingClassName = 'my-6', listClassName, panelsClassName, actions, variant = 'content' } = arg0
  const childItems = Children.toArray(children)
    .filter((child): child is ReactElement<TabProps> => isValidElement(child) && child.type === TabItem)
    .map((child, index) => ({
      id: child.props.value ?? `tab-${index}`,
      label: child.props.title,
      panel: child.props.children,
    }))
  const resolvedItems = items ?? childItems
  const defaultIndex = defaultValue ? Math.max(0, resolvedItems.findIndex((item) => item.id === defaultValue)) : 0

  const [internalIndex, setInternalIndex] = useState(defaultIndex)
  const resolvedIndex = typeof selectedIndex === 'number' ? selectedIndex : internalIndex
  const indicatorLayoutId = useId()

  const handleChange = (index: number) => {
    if (typeof selectedIndex !== 'number') setInternalIndex(index)
    onChange?.(index)
  }

  return (
    <TabGroup selectedIndex={resolvedIndex} onChange={handleChange} className={clsx('clarify-tabs', spacingClassName, className)}>
      <TabList className={clsx(
        'flex max-w-full items-stretch overflow-x-auto border-b',
        variant === 'content' ? 'gap-1 border-(--clarify-theme-tokens-colors-border)' : 'h-10 gap-0 border-(--clarify-code-border) px-3',
        listClassName,
      )}>
        {resolvedItems.map((item) => (
          <Tab
            key={item.id}
            className={({ selected }: TabClassNameProps) => clsx(
              'relative inline-flex shrink-0 items-center px-2.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--clarify-theme-tokens-colors-primary)',
              variant === 'content' ? 'clarify-content-tab clarify-ui-tab my-1 h-9 rounded-(--clarify-theme-tokens-radius-md)' : 'text-2xs font-semibold',
              selected && (variant === 'content' ? 'clarify-ui-tab-active' : 'text-(--clarify-code-text)'),
              variant === 'code' && !selected && 'text-(--clarify-code-muted)',
            )}
          >
            {({ selected }: TabClassNameProps) => (
              <>
                <span>{item.label}</span>
                {selected ? (
                  <motion.span
                    layoutId={indicatorLayoutId}
                    className={clsx(
                      'absolute inset-x-2.5 h-0.5 bg-(--clarify-ui-tab-indicator)',
                      variant === 'content' ? '-bottom-1 rounded-full' : '-bottom-px',
                    )}
                    transition={{ type: 'tween', duration: 0.16, ease: 'easeOut' }}
                  />
                ) : null}
              </>
            )}
          </Tab>
        ))}
        {actions ? <div className="sticky right-0 ml-auto flex shrink-0 items-center bg-(--clarify-code-background)">{actions}</div> : null}
      </TabList>
      <TabPanels className={panelsClassName ?? 'mt-5'}>
        {resolvedItems.map((item) => (
          <TabPanel
            key={item.id}
            static
            className={({ selected }: TabClassNameProps) => clsx(
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)',
              !selected && 'hidden',
            )}
          >
            {item.panel}
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  )
}
