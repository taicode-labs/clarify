import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useId, useState, type ReactNode } from 'react'

type ClarifyTabItem = {
  id: string
  label: ReactNode
  panel: ReactNode
}

type ClarifyTabsProps = {
  items: ClarifyTabItem[]
  selectedIndex?: number
  onChange?: (index: number) => void
  className?: string
  listClassName?: string
  panelsClassName?: string
}

type TabClassNameProps = {
  selected: boolean
}

export function Tabs(arg0: ClarifyTabsProps) {
  const { items, selectedIndex, onChange, className, listClassName, panelsClassName } = arg0

  const [internalIndex, setInternalIndex] = useState(0)
  const resolvedIndex = typeof selectedIndex === 'number' ? selectedIndex : internalIndex
  const indicatorLayoutId = useId()

  const handleChange = (index: number) => {
    if (typeof selectedIndex !== 'number') setInternalIndex(index)
    onChange?.(index)
  }

  return (
    <TabGroup selectedIndex={resolvedIndex} onChange={handleChange} className={className}>
      <TabList className={clsx('flex flex-wrap items-center gap-6 border-b border-(--clarify-theme-tokens-colors-border) pb-0', listClassName)}>
        {items.map((item) => (
          <Tab
            key={item.id}
            className={({ selected }: TabClassNameProps) => clsx(
              'clarify-ui-tab relative inline-flex h-10 shrink-0 items-center px-0 py-0 text-sm font-medium transition focus:outline-none',
              selected && 'clarify-ui-tab-active',
            )}
          >
            {({ selected }: TabClassNameProps) => (
              <>
                <span>{item.label}</span>
                {selected ? (
                  <motion.span
                    layoutId={indicatorLayoutId}
                    className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-(--clarify-theme-tokens-colors-foreground)"
                    transition={{ type: 'tween', duration: 0.16, ease: 'easeOut' }}
                  />
                ) : null}
              </>
            )}
          </Tab>
        ))}
      </TabList>
      <TabPanels className={clsx('mt-4', panelsClassName)}>
        {items.map((item) => (
          <TabPanel key={item.id} className="focus:outline-none">
            {item.panel}
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  )
}
