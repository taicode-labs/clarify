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
  listClassName?: string
  panelsClassName?: string
}

type TabClassNameProps = {
  selected: boolean
}

export function Tabs(arg0: TabsProps) {
  const { items, children, defaultValue, selectedIndex, onChange, className, listClassName, panelsClassName } = arg0
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
    <TabGroup selectedIndex={resolvedIndex} onChange={handleChange} className={clsx('clarify-tabs my-6', className)}>
      <TabList className={clsx('flex max-w-full items-stretch gap-6 overflow-x-auto border-b border-(--clarify-theme-tokens-colors-border)', listClassName)}>
        {resolvedItems.map((item) => (
          <Tab
            key={item.id}
            className={({ selected }: TabClassNameProps) => clsx(
              'clarify-content-tab clarify-ui-tab relative inline-flex h-10 shrink-0 items-center px-0 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--clarify-theme-tokens-colors-primary)',
              selected && 'clarify-ui-tab-active',
            )}
          >
            {({ selected }: TabClassNameProps) => (
              <>
                <span>{item.label}</span>
                {selected ? (
                  <motion.span
                    layoutId={indicatorLayoutId}
                    className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-(--clarify-ui-tab-indicator)"
                    transition={{ type: 'tween', duration: 0.16, ease: 'easeOut' }}
                  />
                ) : null}
              </>
            )}
          </Tab>
        ))}
      </TabList>
      <TabPanels className={clsx('mt-5', panelsClassName)}>
        {resolvedItems.map((item) => (
          <TabPanel key={item.id} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)">
            {item.panel}
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  )
}
