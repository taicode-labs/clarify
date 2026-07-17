import { useTranslation } from 'react-i18next'

import { ButtonLink } from '../../components/elements/button'
import { CallToActionSimpleCentered } from '../../components/sections/call-to-action-simple-centered'
import { Plan, PricingMultiTier } from '../../components/sections/pricing-multi-tier'
import { SiteFaqs } from '../../components/sections/site-faqs'
import { site } from '../../site'
import { createMeta } from '../../utils/seo'

import { PlanComparisonTable } from './components/plan-comparison-table'
import { useComparisonFeatures, usePricingPlans } from './use-pricing-content'

export const meta = () => createMeta(
  'Pricing - Clarify',
  'Publish documentation with Clarify for free, or choose commercial services for expert implementation and support.',
  '/pricing/',
)

export default function PricingPage() {
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
        plans={pricingPlans.map((plan) => (
          <Plan key={String(plan.name)} {...plan} subheadline={<p>{plan.subheadline}</p>} />
        ))}
      />
      <PlanComparisonTable
        plans={planNames}
        features={comparisonFeatures}
        compareLabel={t('common.compareFeatures')}
        includedLabel={t('common.included')}
        notIncludedLabel={t('common.notIncluded')}
      />
      <SiteFaqs />
      <CallToActionSimpleCentered
        headline={t('pricing.ctaHeadline')}
        subheadline={<p>{t('pricing.ctaSubheadline')}</p>}
        cta={<ButtonLink href={site.contactUrl} size="lg">{t('pricing.ctaButton')}</ButtonLink>}
      />
    </>
  )
}
