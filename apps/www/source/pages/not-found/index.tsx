import { useTranslation } from 'react-i18next'

import { ButtonLink } from '../../components/elements/button'
import { CallToActionSimpleCentered } from '../../components/sections/call-to-action-simple-centered'
import { createMeta } from '../../utils/seo'

export const meta = () => createMeta(
  'Page not found - Clarify',
  'The page you requested could not be found.',
  '/',
)

export default function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <CallToActionSimpleCentered
      headline={t('notFound.headline')}
      subheadline={<p>{t('notFound.subheadline')}</p>}
      cta={<ButtonLink href="/">{t('notFound.home')}</ButtonLink>}
    />
  )
}
