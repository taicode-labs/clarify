export const docsLinks = {
  home: '/',
  gettingStarted: '/getting-started',
  installation: '/getting-started/installation',
  features: '/features',
  openapi: '/features/openapi',
  reference: '/reference',
  guides: '/guides',
  apiDemo: '/showcase/openapi-demo',
  github: 'https://github.com/taicode-labs/clarify',
} as const

export const primaryNavLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'OpenAPI', href: '#openapi' },
  { label: 'Docs', href: docsLinks.gettingStarted },
] as const
