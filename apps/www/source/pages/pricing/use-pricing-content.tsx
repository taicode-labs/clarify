import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { ButtonLink, SoftButtonLink } from '../../components/elements/button'
import { site } from '../../site'

export function usePricingPlans() {
  const { t } = useTranslation()

  return [
    {
      name: t('pricing.freeName'),
      price: t('pricing.freePrice'),
      period: t('pricing.freePeriod'),
      subheadline: t('pricing.freeSubheadline'),
      features: t('pricing.freeFeatures', { returnObjects: true }) as ReactNode[],
      cta: <SoftButtonLink href={site.githubUrl} size="lg">{t('pricing.freeCta')}</SoftButtonLink>,
    },
    {
      name: t('pricing.partnerName'),
      price: t('pricing.partnerPrice'),
      period: t('pricing.partnerPeriod'),
      badge: t('pricing.partnerBadge'),
      subheadline: t('pricing.partnerSubheadline'),
      features: t('pricing.partnerFeatures', { returnObjects: true }) as ReactNode[],
      cta: <ButtonLink href={site.contactUrl} size="lg">{t('pricing.partnerCta')}</ButtonLink>,
    },
  ]
}

export function useComparisonFeatures() {
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
