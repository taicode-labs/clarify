import { Tab as HeadlessTab, TabGroup, TabList, TabPanels, TabPanel } from '@headlessui/react'
import clsx from 'clsx'
import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode, useMemo, useState } from 'react'

import { lucideIconRegistry, resolveLucideIconName } from '../utils/lucide'

import { usePanelSyncStore } from './panel-sync'

type TabItemProps = {
  title: string
  id?: string
  icon?: string | ReactNode
  children?: ReactNode
  className?: string
} & Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>

export function Tab(arg0: TabItemProps) {
  const { children } = arg0
  return <>{children}</>
}

function resolveIcon(icon: string | ReactNode | undefined) {
  if (!icon) return null
  if (typeof icon !== 'string') return icon

  const iconName = resolveLucideIconName(icon)
  if (!iconName) return null

  const Icon = lucideIconRegistry[iconName]
  return Icon ? <Icon className="size-4" aria-hidden="true" /> : null
}

type TabsProps = {
  children?: ReactNode
  defaultTabIndex?: number
  sync?: boolean
  borderBottom?: boolean
  className?: string
} & Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className' | 'onChange'>

export function Tabs(arg0: TabsProps) {
  const { children, defaultTabIndex = 0, sync = true, borderBottom = true, className, ...props } = arg0
  const items = Children.toArray(children).filter(isValidElement<TabItemProps>)
  const panelTitles = useMemo(
    () =>
      items
        .map((item) => item.props.title)
        .filter((title): title is string => Boolean(title)),
    [items],
  )
  const tabCount = panelTitles.length
  const clampedDefaultIndex = Math.min(Math.max(defaultTabIndex, 0), Math.max(tabCount - 1, 0))
  const [selectedIndex, setSelectedIndex] = useState(clampedDefaultIndex)
  const { preferredPanelTitles, addPreferredPanelTitle } = usePanelSyncStore()

  const uniqueTitles = new Set(panelTitles).size === panelTitles.length
  const activeTitle = useMemo(() => {
    if (!sync || !uniqueTitles || panelTitles.length === 0) return undefined
    return [...panelTitles].sort(
      (a, z) => preferredPanelTitles.indexOf(z) - preferredPanelTitles.indexOf(a),
    )[0]
  }, [panelTitles, preferredPanelTitles, sync, uniqueTitles])

  // Derive the controlled index from sync state or use local selectedIndex
  const derivedSelectedIndex = useMemo(() => {
    if (sync && activeTitle && uniqueTitles) {
      const activeIndex = panelTitles.indexOf(activeTitle)
      if (activeIndex !== -1) return activeIndex
    }
    return selectedIndex
  }, [sync, activeTitle, uniqueTitles, panelTitles, selectedIndex])

  return (
    <TabGroup
      selectedIndex={derivedSelectedIndex}
      onChange={(index) => {
        setSelectedIndex(index as number)
        if (sync) addPreferredPanelTitle(panelTitles[index as number])
      }}
      className={clsx('clarify-tabs my-8', className)}
      as="div"
      {...props}
    >
      <TabList
        className={clsx(
          'clarify-tabs-list -mb-px flex flex-wrap gap-0.5 overflow-x-auto',
          borderBottom && 'border-b border-(--clarify-theme-tokens-colors-border)',
        )}
      >
        {items.map((item, index) => {
          const title = item.props.title
          const icon = resolveIcon(item.props.icon)
          return (
            <HeadlessTab
              key={item.key ?? `${title}-${index}`}
              className={({ selected }) =>
                clsx(
                  'clarify-tab relative inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2 text-[14px] font-medium transition',
                  selected
                    ? 'border-b-(--clarify-theme-tokens-colors-primary) text-(--clarify-theme-tokens-colors-primary)'
                    : 'border-b-transparent text-(--clarify-theme-tokens-colors-muted) hover:border-b-zinc-700 hover:text-(--clarify-theme-tokens-colors-foreground)',
                )
              }
            >
              {icon ? <span className="flex-none [&_svg]:size-4">{icon}</span> : null}
              <span>{title}</span>
            </HeadlessTab>
          )
        })}
      </TabList>
      <TabPanels className="clarify-tabs-panels mt-6">
        {items.map((item, index) => (
          <TabPanel
            key={item.key ?? `${item.props.title}-${index}`}
            id={item.props.id}
            className="clarify-tab-panel"
          >
            {item.props.children}
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  )
}
