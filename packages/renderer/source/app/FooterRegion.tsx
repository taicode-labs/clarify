import { RuntimeSlot } from '../slots'

import { BuiltWithClarify } from './BuiltWithClarify'
import { PageFooter } from './PageFooter'

type FooterRegionProps = {
  version?: string
}

function DefaultFooterComponent() {
  return <PageFooter />
}

export function FooterRegion(props: FooterRegionProps) {
  const { version } = props

  return (
    <div className="clarify-page-footer-region mt-8 grid gap-5 border-t border-(--clarify-theme-tokens-colors-border) pt-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div className="clarify-page-footer-slot min-w-0">
        <RuntimeSlot name="page.footer.before" />
        <RuntimeSlot name="page.footer.replace" default={DefaultFooterComponent} />
      </div>
      <div className="clarify-page-attribution flex justify-end sm:self-end">
        <BuiltWithClarify version={version} />
      </div>
    </div>
  )
}
