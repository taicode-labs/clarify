import { useSlot } from 'virtual:clarify/slot'

export default function CustomFooter() {
  const { DefaultComponent } = useSlot()

  return (
    <div className="border-t border-(--clarify-ui-accent-border) bg-(--clarify-ui-accent-background) py-8">
      <div className="mx-auto max-w-(--clarify-theme-layout-max-width) px-4 text-center text-sm text-(--clarify-ui-text-soft)">
        <p>© 2026 Clarify Labs. Open-source documentation publishing.</p>
        <div className="mt-4">
          <DefaultComponent />
        </div>
      </div>
    </div>
  )
}
