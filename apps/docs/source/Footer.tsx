import { useClarifySlot } from 'virtual:clarify/slot'

export default function Footer() {
  const { plugin } = useClarifySlot()

  return (
    <div className="grid gap-8 rounded-2xl border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-ui-subtle-background) p-6 text-sm sm:grid-cols-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="m-0 font-semibold text-(--clarify-theme-tokens-colors-foreground)">Clarify</p>
          <span className="rounded-md bg-(--clarify-theme-tokens-colors-primary)/10 px-2 py-0.5 text-[10px] font-medium text-(--clarify-theme-tokens-colors-primary)">
            {plugin}
          </span>
        </div>
        <p className="mt-2 mb-0 text-(--clarify-theme-tokens-colors-muted)">
          Open-source documentation publishing for MDX and OpenAPI.
        </p>
      </div>
      <div>
        <p className="m-0 font-semibold text-(--clarify-theme-tokens-colors-foreground)">Docs</p>
        <div className="mt-2 flex flex-col gap-2">
          <a className="no-underline text-(--clarify-theme-tokens-colors-muted) transition hover:text-(--clarify-theme-tokens-colors-foreground)" href="/getting-started">Get Started</a>
          <a className="no-underline text-(--clarify-theme-tokens-colors-muted) transition hover:text-(--clarify-theme-tokens-colors-foreground)" href="/reference/clarify-config">Config Reference</a>
        </div>
      </div>
      <div>
        <p className="m-0 font-semibold text-(--clarify-theme-tokens-colors-foreground)">Community</p>
        <div className="mt-2 flex flex-col gap-2">
          <a className="no-underline text-(--clarify-theme-tokens-colors-muted) transition hover:text-(--clarify-theme-tokens-colors-foreground)" href="https://github.com/taicode-labs/clarify" target="_blank" rel="noreferrer">GitHub</a>
          <a className="no-underline text-(--clarify-theme-tokens-colors-muted) transition hover:text-(--clarify-theme-tokens-colors-foreground)" href="/development/contributing">Contributing</a>
        </div>
      </div>
    </div>
  )
}
