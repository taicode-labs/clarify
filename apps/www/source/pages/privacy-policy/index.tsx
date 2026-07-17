import { useTranslation } from 'react-i18next'

import { PlainButtonLink } from '../../components/elements/button'
import { ChevronIcon } from '../../components/icons/chevron-icon'
import { CallToActionSimple } from '../../components/sections/call-to-action-simple'
import { site } from '../../site'
import { createMeta } from '../../utils/seo'

export const meta = () => createMeta(
  'Privacy Policy - Clarify',
  'Read the Clarify privacy policy and learn how to contact us about privacy questions.',
  '/privacy-policy/',
)

export default function PrivacyPolicyPage() {
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
