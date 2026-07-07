import type { NavigationNode, RouteItem } from '../../core/types'

import type { SearchItem } from './types'

function routeGroupTitles(navigation: NavigationNode[]) {
  const titles = new Map<string, string>()

  for (const node of navigation) {
    if (node.children?.length) {
      for (const child of node.children) {
        titles.set(child.path, node.title)
      }
    } else {
      titles.set(node.path, node.title)
    }
  }

  return titles
}

export function buildSearchItems(routes: RouteItem[], navigation: NavigationNode[]): SearchItem[] {
  const groupTitles = routeGroupTitles(navigation)

  return routes.flatMap((route) => {
    // Skip bare alias routes (e.g., /path) from search to avoid duplicates in multilingual sites
    if (route.isBareAlias) return []
    
    const groupTitle = groupTitles.get(route.path)
    const pageItem: SearchItem = {
      title: route.title,
      pageTitle: route.title,
      sectionTitle: groupTitle,
      url: route.path,
      keywords: [groupTitle, route.title, route.path, route.kind].filter(Boolean).join(' ').toLowerCase(),
    }

    const sectionItems = route.document?.metadata.sections?.map((section) => ({
      title: section.title,
      pageTitle: route.title,
      sectionTitle: groupTitle,
      url: `${route.path}#${section.id}`,
      keywords: [groupTitle, route.title, section.title, route.path, section.id].filter(Boolean).join(' ').toLowerCase(),
    })) ?? []

    return [pageItem, ...sectionItems]
  })
}
