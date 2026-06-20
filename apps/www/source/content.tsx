import { ButtonLink, PlainButtonLink, SoftButtonLink } from './ui/elements/button'
import { ArrowNarrowRightIcon } from './ui/icons/arrow-narrow-right-icon'
import { ChevronIcon } from './ui/icons/chevron-icon'

export const site = {
  docsUrl: 'https://docs.clarify.pub',
  githubUrl: 'https://github.com/taicode-labs/clarify',
  contactUrl: 'mailto:hello@taicode.com',
}

export const navLinks = [
  { href: '/#features', label: 'Features' },
  { href: '/pricing/', label: 'Pricing' },
  { href: '/about/', label: 'About' },
  { href: site.docsUrl, label: 'Docs' },
]

export const hero = {
  badge: 'Open-source MDX and OpenAPI publishing for modern teams',
  badgeCta: 'View roadmap',
  headline: 'Publish polished developer docs without rebuilding your stack.',
  subheadline:
    'Clarify turns MDX, OpenAPI schemas, React components, and Vite builds into a fast static documentation site your team can own, theme, and deploy anywhere.',
}

export const stats = [
  { stat: '100%', text: 'Static output for CDN, object storage, and edge hosting.' },
  { stat: 'MDX', text: 'Author guides with Markdown and reusable React components.' },
  { stat: 'OpenAPI', text: 'Generate reference pages from schemas without hand-maintained tables.' },
  { stat: 'Vite', text: 'Fast local iteration and production optimized builds.' },
]

export const workflow = [
  {
    label: '01',
    title: 'Bring your content',
    text: 'Import existing Markdown, write new MDX pages, and connect one or more OpenAPI files.',
  },
  {
    label: '02',
    title: 'Shape the experience',
    text: 'Configure navigation, theme tokens, landing pages, API references, and reusable sections.',
  },
  {
    label: '03',
    title: 'Deploy statically',
    text: 'Generate a pure static output folder and host it on any CDN or static hosting provider.',
  },
]

export function primaryCta() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <ButtonLink href={site.docsUrl} size="lg">
        Start building
      </ButtonLink>
      <PlainButtonLink href={site.githubUrl} size="lg">
        View GitHub <ArrowNarrowRightIcon />
      </PlainButtonLink>
    </div>
  )
}

export const pricingPlans = [
  {
    name: 'Free',
    price: 'Free',
    period: 'forever',
    subheadline: 'For individuals, open-source projects, and teams that want to run Clarify themselves.',
    features: ['AGPL-licensed core', 'MDX pages', 'OpenAPI reference', 'Vite SSG static export', 'Community support'],
    cta: (
      <SoftButtonLink href={site.githubUrl} size="lg">
        Get the source
      </SoftButtonLink>
    ),
  },
  {
    name: 'Delivery Partner',
    price: 'Custom',
    period: 'project',
    badge: 'Commercial service',
    subheadline: 'For organizations that want Taicode Labs to design, migrate, customize, and launch the docs site.',
    features: ['Everything in Free', 'Content migration', 'Custom components', 'OpenAPI modeling', 'SSG deployment pipeline', 'Team enablement'],
    cta: (
      <ButtonLink href={site.contactUrl} size="lg">
        Book a scope call
      </ButtonLink>
    ),
  },
]

export const comparisonFeatures = [
  {
    title: 'Publishing',
    features: [
      { name: 'Static site generation', value: true },
      { name: 'MDX documentation pages', value: true },
      { name: 'OpenAPI reference generation', value: true },
      { name: 'Custom domain deployment review', value: { Free: false, 'Delivery Partner': true } },
    ],
  },
  {
    title: 'Support',
    features: [
      { name: 'Community issue support', value: true },
      { name: 'Private implementation support', value: { Free: false, 'Delivery Partner': true } },
      { name: 'Migration planning', value: { Free: false, 'Delivery Partner': true } },
      { name: 'Done-for-you delivery', value: { Free: false, 'Delivery Partner': true } },
    ],
  },
  {
    title: 'Customization',
    features: [
      { name: 'Theme tokens', value: true },
      { name: 'Renderer component reuse', value: true },
      { name: 'Custom landing sections', value: { Free: 'Self-serve', 'Delivery Partner': true } },
      { name: 'Bespoke integrations', value: { Free: false, 'Delivery Partner': true } },
    ],
  },
]

export const faqs = [
  {
    question: 'Is Clarify free to use?',
    answer: 'Yes. The core project is open source under AGPL-3.0-only. Commercial services are optional for teams that want private support or delivery help.',
  },
  {
    question: 'Can the marketing site and docs be deployed as static files?',
    answer: 'Yes. The www app uses Vite and is configured to generate static HTML for supported routes, so it can be hosted on any static platform.',
  },
  {
    question: 'Do we need to rewrite our existing docs?',
    answer: 'No. Clarify is designed around file-based MDX and OpenAPI inputs, so existing Markdown and schemas can be migrated incrementally.',
  },
  {
    question: 'What does Delivery Partner include?',
    answer: 'Scoped implementation guidance, migration planning, deployment review, and optional done-for-you customization by Taicode Labs.',
  },
]

export function finalCta() {
  return (
    <div className="flex flex-wrap items-center justify-start gap-4">
      <ButtonLink href={site.docsUrl} size="lg">
        Read the docs
      </ButtonLink>
      <PlainButtonLink href={site.contactUrl} size="lg">
        Commercial services <ChevronIcon />
      </PlainButtonLink>
    </div>
  )
}
