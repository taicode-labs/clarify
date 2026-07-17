import { useTranslation } from 'react-i18next'

import { FAQsTwoColumnAccordion, Faq } from './faqs-two-column-accordion'

type FaqItem = { question: string; answer: string }

export function SiteFaqs() {
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
