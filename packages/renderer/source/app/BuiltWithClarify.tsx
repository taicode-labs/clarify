import clarifyMarkUrl from '../assets/clarify.svg?url'
import { useBuiltInText } from '../core/i18n'

// Tracking endpoint hosted on clarify.pub. Loaded via a hidden iframe so the
// host site never runs our analytics scripts - the iframe reports a page view
// to our GA4 property with the host site as the HTTP referrer, which is all we
// need to know which sites use Clarify. Zero impact on the host site.
const CLARIFY_TRACKING_URL = 'https://clarify.pub/api/track'

export function BuiltWithClarify() {
  const t = useBuiltInText()

  return (
    <div className="clarify-built-with inline-flex items-center gap-1.5">
      <iframe
        tabIndex={-1}
        aria-hidden="true"
        title={t('builtWith.label')}
        src={CLARIFY_TRACKING_URL}
        // Hidden but still loads: display:none would still load in most
        // browsers, but width/height:0 + position:absolute keeps it out of
        // layout and accessibility tree reliably.
        style={{ position: 'absolute', width: 0, height: 0, border: 0, overflow: 'hidden' }}
      />
      <a
        href="https://clarify.pub"
        target="_blank"
        rel="noreferrer"
        aria-label={t('builtWith.label')}
        className="clarify-built-with inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-medium no-underline transition"
      >
        <span>{t('builtWith.prefix')}</span>
        <img src={clarifyMarkUrl} alt="" className="clarify-built-with-logo h-3.5 w-auto flex-none object-contain" />
        <span className="clarify-built-with-brand font-semibold">Clarify</span>
      </a>
    </div>
  )
}
