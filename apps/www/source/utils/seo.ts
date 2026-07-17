import type { MetaDescriptor } from 'react-router'

const siteUrl = 'https://clarify.pub'

export function createMeta(title: string, description: string, pathname: string): MetaDescriptor[] {
  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: new URL(pathname, siteUrl).href },
    { tagName: 'link', rel: 'canonical', href: new URL(pathname, siteUrl).href },
  ]
}
