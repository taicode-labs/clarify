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
      <TabList className={clsx('-mx-2 flex flex-wrap items-center gap-2 border-b border-(--clarify-theme-tokens-colors-border) px-2 pb-0', listClassName)}>
        {items.map((item) => (
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
        {items.map((item) => (
          <TabPanel key={item.id} className="focus:outline-none">
            {item.panel}
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  )
}
