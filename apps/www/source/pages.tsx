import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { MainPreview, MdxPreview, OpenApiPreview } from '@clarify-labs/renderer/preview'

import { site } from './content'
import { AnnouncementBadge } from './ui/elements/announcement-badge'
import { ButtonLink, PlainButtonLink, SoftButtonLink } from './ui/elements/button'
import { Screenshot } from './ui/elements/screenshot'
import { ArrowNarrowRightIcon } from './ui/icons/arrow-narrow-right-icon'
import { ChevronIcon } from './ui/icons/chevron-icon'
import { CallToActionSimple } from './ui/sections/call-to-action-simple'
import { CallToActionSimpleCentered } from './ui/sections/call-to-action-simple-centered'
import { FAQsTwoColumnAccordion, Faq } from './ui/sections/faqs-two-column-accordion'
import { FeatureWithDemo, FeaturesTwoColumnWithDemos } from './ui/sections/features-two-column-with-demos'
import { HeroLeftAlignedWithDemo } from './ui/sections/hero-left-aligned-with-demo'
import { PlanComparisonTable } from './ui/sections/plan-comparison-table'
import { Plan, PricingMultiTier } from './ui/sections/pricing-multi-tier'
import { Stat, StatsFourColumns } from './ui/sections/stats-four-columns'
import { Testimonial, TestimonialThreeColumnGrid } from './ui/sections/testimonials-three-column-grid'

type StatItem = { stat: string; text: string }
type WorkflowItem = { label: string; title: string; text: string }
type FaqItem = { question: string; answer: string }
type TestimonialItem = [quote: string, name: string, byline: string]

export function HomePage() {
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

      <FAQs />

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

function ProductDemo() {
  return (
    <Screenshot className="rounded-lg" wallpaper="blue" placement="bottom">
      <MainPreview />
    </Screenshot>
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

function usePricingPlans() {
  const { t } = useTranslation()

  return [
    {
      name: t('pricing.freeName'),
      price: t('pricing.freePrice'),
      period: t('pricing.freePeriod'),
      subheadline: t('pricing.freeSubheadline'),
      features: t('pricing.freeFeatures', { returnObjects: true }) as ReactNode[],
      cta: (
        <SoftButtonLink href={site.githubUrl} size="lg">
          {t('pricing.freeCta')}
        </SoftButtonLink>
      ),
    },
    {
      name: t('pricing.partnerName'),
      price: t('pricing.partnerPrice'),
      period: t('pricing.partnerPeriod'),
      badge: t('pricing.partnerBadge'),
      subheadline: t('pricing.partnerSubheadline'),
      features: t('pricing.partnerFeatures', { returnObjects: true }) as ReactNode[],
      cta: (
        <ButtonLink href={site.contactUrl} size="lg">
          {t('pricing.partnerCta')}
        </ButtonLink>
      ),
    },
  ]
}

function useComparisonFeatures() {
  const { t } = useTranslation()
  const freeName = t('pricing.freeName')
  const partnerName = t('pricing.partnerName')

  return [
    {
      title: t('pricing.comparison.publishing'),
      features: [
        { name: t('pricing.comparison.staticSiteGeneration'), value: true },
        { name: t('pricing.comparison.mdxPages'), value: true },
        { name: t('pricing.comparison.openApiGeneration'), value: true },
        { name: t('pricing.comparison.customDomainReview'), value: { [freeName]: false, [partnerName]: true } },
      ],
    },
    {
      title: t('pricing.comparison.support'),
      features: [
        { name: t('pricing.comparison.communitySupport'), value: true },
        { name: t('pricing.comparison.privateSupport'), value: { [freeName]: false, [partnerName]: true } },
        { name: t('pricing.comparison.migrationPlanning'), value: { [freeName]: false, [partnerName]: true } },
        { name: t('pricing.comparison.doneForYouDelivery'), value: { [freeName]: false, [partnerName]: true } },
      ],
    },
    {
      title: t('pricing.comparison.customization'),
      features: [
        { name: t('pricing.comparison.themeTokens'), value: true },
        { name: t('pricing.comparison.rendererReuse'), value: true },
        { name: t('pricing.comparison.customLandingSections'), value: { [freeName]: t('pricing.comparison.selfServe'), [partnerName]: true } },
        { name: t('pricing.comparison.bespokeIntegrations'), value: { [freeName]: false, [partnerName]: true } },
      ],
    },
  ]
}

export function PricingPage() {
  const { t } = useTranslation()
  const pricingPlans = usePricingPlans()
  const comparisonFeatures = useComparisonFeatures()
  const planNames = [t('pricing.freeName'), t('pricing.partnerName')]

  return (
    <>
      <PricingMultiTier
        id="pricing"
        eyebrow={t('pricing.eyebrow')}
        headline={t('pricing.pageHeadline')}
        subheadline={<p>{t('pricing.pageSubheadline')}</p>}
        plans={
          <>
            {pricingPlans.map((plan) => (
              <Plan key={String(plan.name)} {...plan} subheadline={<p>{plan.subheadline}</p>} />
            ))}
          </>
        }
      />
      <PlanComparisonTable
        plans={planNames}
        features={comparisonFeatures}
        compareLabel={t('common.compareFeatures')}
        includedLabel={t('common.included')}
        notIncludedLabel={t('common.notIncluded')}
      />
      <FAQs />
      <CallToActionSimpleCentered
        headline={t('pricing.ctaHeadline')}
        subheadline={<p>{t('pricing.ctaSubheadline')}</p>}
        cta={
          <ButtonLink href={site.contactUrl} size="lg">
            {t('pricing.ctaButton')}
          </ButtonLink>
        }
      />
    </>
  )
}

export function AboutPage() {
  const { t } = useTranslation()
  const stats = t('about.stats', { returnObjects: true }) as StatItem[]

  return (
    <>
      <CallToActionSimple
        id="about"
        eyebrow={t('about.eyebrow')}
        headline={t('about.headline')}
        subheadline={<p>{t('about.subheadline')}</p>}
        cta={
          <div className="flex flex-wrap items-center gap-4">
            <ButtonLink href={site.docsUrl} size="lg">{t('about.docs')}</ButtonLink>
            <PlainButtonLink href={site.githubUrl} size="lg">{t('about.source')} <ChevronIcon /></PlainButtonLink>
          </div>
        }
      />
      <StatsFourColumns headline={t('about.statsHeadline')} subheadline={<p>{t('about.statsSubheadline')}</p>}>
        {stats.map((item) => (
          <Stat key={item.stat} stat={item.stat} text={item.text} />
        ))}
      </StatsFourColumns>
    </>
  )
}

export function PrivacyPolicyPage() {
  const { t } = useTranslation()

  return (
    <CallToActionSimple
      id="privacy"
      eyebrow={t('privacy.eyebrow')}
      headline={t('privacy.headline')}
      subheadline={<p>{t('privacy.subheadline')}</p>}
      cta={<PlainButtonLink href={site.contactUrl}>{t('privacy.contact')} <ChevronIcon /></PlainButtonLink>}
    />
  )
}

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <CallToActionSimpleCentered
      headline={t('notFound.headline')}
      subheadline={<p>{t('notFound.subheadline')}</p>}
      cta={<ButtonLink href="/">{t('notFound.home')}</ButtonLink>}
    />
  )
}

function FAQs() {
  const { t } = useTranslation()
  const faqs = t('faqs.items', { returnObjects: true }) as FaqItem[]

  return (
    <FAQsTwoColumnAccordion
      id="faqs"
      headline={t('faqs.headline')}
      subheadline={<p>{t('faqs.subheadline')}</p>}
    >
      {faqs.map((faq) => (
        <Faq key={faq.question} question={faq.question} answer={<p>{faq.answer}</p>} />
      ))}
    </FAQsTwoColumnAccordion>
  )
}
