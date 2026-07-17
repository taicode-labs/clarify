import { useTranslation } from 'react-i18next'

import { MdxPreview, OpenApiPreview } from '@clarify-labs/renderer/preview'

import { ButtonLink, PlainButtonLink } from '../../components/elements/button'
import { ArrowNarrowRightIcon } from '../../components/icons/arrow-narrow-right-icon'
import { ChevronIcon } from '../../components/icons/chevron-icon'
import { CallToActionSimple } from '../../components/sections/call-to-action-simple'
import { CallToActionSimpleCentered } from '../../components/sections/call-to-action-simple-centered'
import { Plan, PricingMultiTier } from '../../components/sections/pricing-multi-tier'
import { SiteFaqs } from '../../components/sections/site-faqs'
import { Stat, StatsFourColumns } from '../../components/sections/stats-four-columns'
import { site } from '../../site'
import { createMeta } from '../../utils/seo'
import { usePricingPlans } from '../pricing/use-pricing-content'

import { AnnouncementBadge } from './components/announcement-badge'
import { FeatureWithDemo, FeaturesTwoColumnWithDemos } from './components/features-two-column-with-demos'
import { HeroLeftAlignedWithDemo } from './components/hero-left-aligned-with-demo'
import { ProductDemo } from './components/product-demo'
import { Screenshot } from './components/screenshot'
import { Testimonial, TestimonialThreeColumnGrid } from './components/testimonials-three-column-grid'

export const meta = () => createMeta(
  'Clarify - MDX and OpenAPI documentation publishing',
  'Clarify is an open-source documentation publishing tool for MDX, OpenAPI, and static deployments.',
  '/',
)

type StatItem = { stat: string; text: string }
type WorkflowItem = { label: string; title: string; text: string }
type TestimonialItem = [quote: string, name: string, byline: string]

export default function HomePage() {
  const { t } = useTranslation()
  const stats = t('stats.items', { returnObjects: true }) as StatItem[]
  const pricingPlans = usePricingPlans()

  return (
    <>
      <HeroLeftAlignedWithDemo
        id="hero"
        eyebrow={<AnnouncementBadge href="/#workflow" text={t('hero.badge')} cta={t('hero.badgeCta')} />}
        headline={t('hero.headline')}
        subheadline={<p>{t('hero.subheadline')}</p>}
        cta={<PrimaryCta />}
        demo={<ProductDemo />}
      />

      <StatsFourColumns
        id="stats"
        eyebrow={t('stats.eyebrow')}
        headline={t('stats.headline')}
        subheadline={<p>{t('stats.subheadline')}</p>}
      >
        {stats.map((item) => (
          <Stat key={item.stat} stat={item.stat} text={item.text} />
        ))}
      </StatsFourColumns>

      <PowerfulFeaturesSection />
      <WorkflowSection />
      <TestimonialsSection />

      <PricingMultiTier
        id="pricing-preview"
        eyebrow={t('pricing.eyebrow')}
        headline={t('pricing.previewHeadline')}
        subheadline={<p>{t('pricing.previewSubheadline')}</p>}
        cta={
          <PlainButtonLink href="/pricing/" size="lg">
            {t('pricing.comparePlans')} <ArrowNarrowRightIcon />
          </PlainButtonLink>
        }
        plans={
          <>
            {pricingPlans.map((plan) => (
              <Plan key={String(plan.name)} {...plan} subheadline={<p>{plan.subheadline}</p>} />
            ))}
          </>
        }
      />

      <SiteFaqs />

      <CallToActionSimpleCentered
        id="call-to-action"
        headline={t('finalCta.headline')}
        subheadline={<p>{t('finalCta.subheadline')}</p>}
        cta={<FinalCta />}
      />
    </>
  )
}

function PrimaryCta() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center gap-4">
      <ButtonLink href={site.docsUrl} size="lg">
        {t('hero.startBuilding')}
      </ButtonLink>
      <PlainButtonLink href={site.githubUrl} size="lg">
        {t('hero.viewGithub')} <ArrowNarrowRightIcon />
      </PlainButtonLink>
    </div>
  )
}

function FinalCta() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center justify-start gap-4">
      <ButtonLink href={site.docsUrl} size="lg">
        {t('finalCta.docs')}
      </ButtonLink>
      <PlainButtonLink href={site.contactUrl} size="lg">
        {t('finalCta.services')} <ChevronIcon />
      </PlainButtonLink>
    </div>
  )
}

function PowerfulFeaturesSection() {
  const { t } = useTranslation()

  return (
    <FeaturesTwoColumnWithDemos
      id="features"
      eyebrow={t('features.eyebrow')}
      headline={t('features.headline')}
      subheadline={<p>{t('features.subheadline')}</p>}
      features={
        <>
          <FeatureWithDemo
            demo={
              <Screenshot className="h-full" wallpaper="purple" placement="bottom-right">
                <MdxPreview />
              </Screenshot>
            }
            headline={t('features.mdxHeadline')}
            subheadline={<p>{t('features.mdxSubheadline')}</p>}
            cta={
              <PlainButtonLink className="px-0 hover:bg-transparent" href={site.docsUrl}>
                {t('features.mdxCta')} <ArrowNarrowRightIcon />
              </PlainButtonLink>
            }
          />
          <FeatureWithDemo
            demo={
              <Screenshot className="h-full" wallpaper="blue" placement="bottom-left">
                <OpenApiPreview />
              </Screenshot>
            }
            headline={t('features.openApiHeadline')}
            subheadline={<p>{t('features.openApiSubheadline')}</p>}
            cta={
              <PlainButtonLink className="px-0 hover:bg-transparent" href={`${site.docsUrl}/api`}>
                {t('features.openApiCta')} <ArrowNarrowRightIcon />
              </PlainButtonLink>
            }
          />
        </>
      }
    />
  )
}

function TestimonialsSection() {
  const { t } = useTranslation()
  const testimonials = t('testimonials.items', { returnObjects: true }) as TestimonialItem[]

  return (
    <TestimonialThreeColumnGrid
      id="testimonial"
      headline={t('testimonials.headline')}
      subheadline={<p>{t('testimonials.subheadline')}</p>}
    >
      {testimonials.map(([quote, name, byline], index) => (
        <Testimonial
          key={name}
          quote={<p>{quote}</p>}
          img={<img src={`/img/avatars/${index + 10}-size-160.webp`} alt="" className="bg-(--clarify-ui-hover-background)" width={160} height={160} />}
          name={name}
          byline={byline}
        />
      ))}
    </TestimonialThreeColumnGrid>
  )
}

function WorkflowSection() {
  const { t } = useTranslation()
  const workflow = t('workflow.items', { returnObjects: true }) as WorkflowItem[]

  return (
    <CallToActionSimple
      id="workflow"
      eyebrow={t('workflow.eyebrow')}
      headline={t('workflow.headline')}
      subheadline={<p>{t('workflow.subheadline')}</p>}
      cta={
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
          {workflow.map((step) => (
            <div key={step.label} className="rounded-xl bg-(--clarify-ui-subtle-background) p-6">
              <div className="text-sm/7 font-semibold text-(--clarify-ui-text-faint)">{step.label}</div>
              <h3 className="mt-2 text-xl/8 text-(--clarify-ui-text-strong)">{step.title}</h3>
              <p className="mt-2 text-sm/7 text-(--clarify-ui-text-soft)">{step.text}</p>
            </div>
          ))}
        </div>
      }
    />
  )
}
