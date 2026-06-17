export const features = [
  {
    titleKey: 'features.mdx.title',
    descriptionKey: 'features.mdx.description',
    icon: 'M4.75 5.75h10.5M4.75 10h10.5M4.75 14.25h6.5',
  },
  {
    titleKey: 'features.openapi.title',
    descriptionKey: 'features.openapi.description',
    icon: 'M5 6.75h10M5 10h6M5 13.25h10M13.25 10l1.75-1.75L16.75 10 15 11.75 13.25 10Z',
  },
  {
    titleKey: 'features.ui.title',
    descriptionKey: 'features.ui.description',
    icon: 'M5.25 5.25h4.5v4.5h-4.5v-4.5ZM10.25 10.25h4.5v4.5h-4.5v-4.5ZM5.25 12.25h3M12.25 5.25h2.5v2.5',
  },
  {
    titleKey: 'features.workflow.title',
    descriptionKey: 'features.workflow.description',
    icon: 'm10.75 3.75-5 7h4l-1.5 5.5 6-7.5h-4l.5-5Z',
  },
  {
    titleKey: 'features.typescript.title',
    descriptionKey: 'features.typescript.description',
    icon: 'M5 5.5h10M8.5 5.5v9M11.5 10.5h3M11.5 14.5h3',
  },
  {
    titleKey: 'features.i18n.title',
    descriptionKey: 'features.i18n.description',
    icon: 'M10 16.75a6.75 6.75 0 1 0 0-13.5 6.75 6.75 0 0 0 0 13.5ZM3.25 10h13.5M10 3.25c1.8 1.85 2.7 4.1 2.7 6.75s-.9 4.9-2.7 6.75C8.2 14.9 7.3 12.65 7.3 10s.9-4.9 2.7-6.75Z',
  },
] as const

export const workflowSteps = [
  ['workflow.write.title', 'workflow.write.description'],
  ['workflow.connect.title', 'workflow.connect.description'],
  ['workflow.publish.title', 'workflow.publish.description'],
] as const

export const capabilityTags = ['tags.mdx', 'tags.openapi', 'tags.react', 'tags.vite'] as const

export const previewNavItems = ['preview.gettingStarted', 'preview.guides', 'preview.components', 'preview.apiReference'] as const
