import { Fragment } from 'react'

export function PageSkeleton() {
  return (
    <div className="clarify-page-skeleton animate-pulse space-y-8 py-8">
      <div className="h-11 w-full max-w-[24rem] rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="space-y-6">
        <div className="h-7 w-full max-w-[28rem] rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-7 w-full max-w-[22rem] rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="h-52 rounded-[1.75rem] bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-52 rounded-[1.75rem] bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, index) => (
          <Fragment key={index}>
            <div className="h-5 w-full max-w-[18rem] rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-32 rounded-[1.5rem] bg-zinc-200 dark:bg-zinc-800" />
          </Fragment>
        ))}
      </div>
    </div>
  )
}
