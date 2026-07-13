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
      <TabList className={clsx('flex w-fit max-w-full flex-wrap items-center gap-1 rounded-(--clarify-theme-tokens-radius-lg) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-code-background) p-1', listClassName)}>
        {resolvedItems.map((item) => (
          <Tab
            key={item.id}
            className={({ selected }: TabClassNameProps) => clsx(
              'clarify-content-tab clarify-ui-tab relative isolate inline-flex h-8 shrink-0 items-center rounded-(--clarify-theme-tokens-radius-md) px-3 py-0 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary) focus-visible:ring-offset-1',
              selected && 'clarify-ui-tab-active',
            )}
          >
            {({ selected }: TabClassNameProps) => (
              <>
                <span>{item.label}</span>
                {selected ? (
                  <motion.span
                    layoutId={indicatorLayoutId}
                    className="absolute inset-0 -z-10 rounded-(--clarify-theme-tokens-radius-md) bg-(--clarify-theme-tokens-colors-surface) shadow-xs ring-1 ring-black/5 dark:ring-white/10"
                    transition={{ type: 'spring', stiffness: 460, damping: 34, mass: 0.7 }}
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
