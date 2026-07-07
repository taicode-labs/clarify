import { Chrome } from '../chrome'
import { PreviewEnvironment } from '../environment'
import { staticOutputEndpoint } from '../fixtures'
import { OpenApiExamplesPreview } from '../openapi'

export function OpenApiPreview() {
  return (
    <PreviewEnvironment>
      <Chrome title="source/api.openapi.json" status="Endpoint + examples">
        <div className="clarify-preview-openapi-window overflow-x-hidden overflow-y-auto bg-(--clarify-theme-tokens-colors-background) px-3 py-3 sm:px-4 sm:py-4 dark:bg-zinc-950">
          <div className="clarify-preview-openapi-mask min-h-full">
            <div className="clarify-preview-api-content clarify-preview-api-content-openapi origin-top pb-6 sm:pb-10">
              <OpenApiExamplesPreview endpoint={staticOutputEndpoint} />
            </div>
          </div>
        </div>
      </Chrome>
    </PreviewEnvironment>
  )
}
