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
    <TabGroup selectedIndex={resolvedIndex} onChange={handleChange} className={className}>
      <TabList className={clsx('-mx-2 flex flex-wrap items-center gap-2 border-b border-(--clarify-theme-tokens-colors-border) px-2 pb-0', listClassName)}>
        {resolvedItems.map((item) => (
          <Tab
            key={item.id}
            className={({ selected }: TabClassNameProps) => clsx(
              'clarify-content-tab clarify-ui-tab relative inline-flex h-10 shrink-0 items-center rounded-t-md px-2 py-0 text-sm font-medium transition-colors focus:outline-none',
              selected && 'clarify-ui-tab-active',
            )}
          >
            {({ selected }: TabClassNameProps) => (
              <>
                <span>{item.label}</span>
                {selected ? (
                  <motion.span
                    layoutId={indicatorLayoutId}
                    className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-(--clarify-ui-tab-indicator) shadow-[0_0_0.5rem_var(--clarify-ui-accent-glow)]"
                    transition={{ type: 'spring', stiffness: 460, damping: 34, mass: 0.7 }}
                  />
                ) : null}
              </>
            )}
          </Tab>
        ))}
      </TabList>
      <TabPanels className={clsx('mt-4', panelsClassName)}>
        {resolvedItems.map((item) => (
          <TabPanel key={item.id} className="focus:outline-none">
            {item.panel}
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  )
}
