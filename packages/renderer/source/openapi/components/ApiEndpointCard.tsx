import { Tag } from '../../components/Tag'

export type ApiEndpointCardProps = {
  id?: string
  method: string
  path: string
  description?: string
}

export function ApiEndpointCard(arg0: ApiEndpointCardProps) {
  const { method, path, description, id } = arg0

  return (
    <article id={id} className="clarify-api-endpoint-card scroll-mt-20 rounded-2xl border border-zinc-900/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <Tag>{method}</Tag>
        <code className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{path}</code>
      </div>
      {description ? <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{description}</p> : null}
    </article>
  )
}
