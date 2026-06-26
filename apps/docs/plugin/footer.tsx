import { useSlot } from 'virtual:clarify/slot'

const site = {
  docsUrl: 'https://docs.clarify.pub',
  githubUrl: 'https://github.com/taicode-labs/clarify',
  contactUrl: 'mailto:sales@clarify.pub',
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-5">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-5">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export default function DocsFooter() {
  const { DefaultComponent } = useSlot()

  return (
    <footer className="border-t border-(--clarify-theme-tokens-colors-border) pt-16">
      <div className="bg-(--clarify-ui-subtle-background) py-16 text-(--clarify-ui-text-strong)">
        <div className="mx-auto max-w-(--clarify-theme-layout-max-width) px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-x-6 gap-y-16 text-sm/7 lg:grid-cols-2">
            {/* Left: description */}
            <div className="flex flex-col gap-4">
              <p className="text-(--clarify-ui-text-soft) max-w-sm">
                Clarify 是一个开源文档发布工具，为 MDX 和 OpenAPI 而生。将你的内容转化为快速、可部署的静态文档站点。
              </p>
            </div>

            {/* Right: link categories */}
            <nav className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div>
                <h3 className="font-semibold">Product</h3>
                <ul role="list" className="mt-2 flex flex-col gap-2">
                  <li className="text-(--clarify-ui-text-soft)"><a href="/getting-started">Docs</a></li>
                  <li className="text-(--clarify-ui-text-soft)"><a href="/features">Features</a></li>
                  <li className="text-(--clarify-ui-text-soft)"><a href="/roadmap">Roadmap</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Company</h3>
                <ul role="list" className="mt-2 flex flex-col gap-2">
                  <li className="text-(--clarify-ui-text-soft)"><a href={site.githubUrl}>GitHub</a></li>
                  <li className="text-(--clarify-ui-text-soft)"><a href={site.contactUrl}>Contact</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Resources</h3>
                <ul role="list" className="mt-2 flex flex-col gap-2">
                  <li className="text-(--clarify-ui-text-soft)"><a href="/getting-started">Get Started</a></li>
                  <li className="text-(--clarify-ui-text-soft)"><a href="/guides">Guides</a></li>
                  <li className="text-(--clarify-ui-text-soft)"><a href="/reference">Reference</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Legal</h3>
                <ul role="list" className="mt-2 flex flex-col gap-2">
                  <li className="text-(--clarify-ui-text-soft)"><a href="https://clarify.pub/privacy-policy/">Privacy Policy</a></li>
                  <li className="text-(--clarify-ui-text-soft)"><a href="https://clarify.pub/pricing/">Commercial Services</a></li>
                </ul>
              </div>
            </nav>
          </div>

          {/* Bottom: fineprint + social */}
          <div className="mt-16 flex items-center justify-between gap-10 text-sm/7">
            <div className="text-(--clarify-ui-text-faint)">
              © 2026 Clarify Labs. Open-source documentation publishing.
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <a href="https://x.com/yxulai" target="_blank" rel="noopener noreferrer" aria-label="X" className="text-(--clarify-ui-text-strong)">
                <XIcon />
              </a>
              <a href={site.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-(--clarify-ui-text-strong)">
                <GitHubIcon />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
