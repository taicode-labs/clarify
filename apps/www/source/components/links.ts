const docsBaseUrl = 'https://docs.clarify.pub'

export const docsLinks = {
  home: '/',
  gettingStarted: `${docsBaseUrl}/getting-started`,
  installation: `${docsBaseUrl}/getting-started/installation`,
  features: `${docsBaseUrl}/features`,
  openapi: `${docsBaseUrl}/features/openapi`,
  reference: `${docsBaseUrl}/reference`,
  guides: `${docsBaseUrl}/guides`,
  apiDemo: `${docsBaseUrl}/showcase/openapi-demo`,
  github: 'https://github.com/taicode-labs/clarify',
} as const

export const primaryNavLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'OpenAPI', href: '#openapi' },
  { label: 'Docs', href: docsLinks.gettingStarted },
] as const
