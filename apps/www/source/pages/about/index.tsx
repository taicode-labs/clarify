import { useTranslation } from 'react-i18next'

import { ButtonLink, PlainButtonLink } from '../../components/elements/button'
import { ChevronIcon } from '../../components/icons/chevron-icon'
import { CallToActionSimple } from '../../components/sections/call-to-action-simple'
import { Stat, StatsFourColumns } from '../../components/sections/stats-four-columns'
import { site } from '../../site'
import { createMeta } from '../../utils/seo'

type StatItem = { stat: string; text: string }

export const meta = () => createMeta(
  'About - Clarify',
  'Learn why Clarify makes open-source documentation publishing simpler for teams and independent developers.',
  '/about/',
)

export default function AboutPage() {
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
        {stats.map((item) => <Stat key={item.stat} stat={item.stat} text={item.text} />)}
      </StatsFourColumns>
    </>
  )
}
