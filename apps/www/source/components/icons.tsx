export function LogoMark() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400 shadow-sm shadow-emerald-500/20">
      <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 fill-zinc-950">
        <path d="M13.5 5.75A3.25 3.25 0 0 0 10.25 2.5h-4.5A3.25 3.25 0 0 0 2.5 5.75v7.15a.6.6 0 0 0 .973.47l2.04-1.62a2.4 2.4 0 0 1 1.493-.525h3.244a3.25 3.25 0 0 0 3.25-3.25V5.75Z" />
      </svg>
    </div>
  )
}

export function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="mt-0.5 h-5 w-5">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="m11.5 6.5 3 3.5m0 0-3 3.5m3-3.5h-9" />
    </svg>
  )
}

export function FeatureIcon(arg0: { path: string }) {
  const { path } = arg0

  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5 stroke-emerald-500 dark:stroke-emerald-400">
      <path d={path} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  )
}

export function SunIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5 stroke-current">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 3.25v1.5M10 15.25v1.5M4.25 10h-1.5M17.25 10h-1.5M5.934 5.934 4.873 4.873M15.127 15.127l-1.061-1.061M14.066 5.934l1.061-1.061M4.873 15.127l1.061-1.061M13.25 10a3.25 3.25 0 1 1-6.5 0 3.25 3.25 0 0 1 6.5 0Z" />
    </svg>
  )
}

export function MoonIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5 stroke-current">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.25 12.75A6.75 6.75 0 0 1 7.25 4.75a6.75 6.75 0 1 0 8 8Z" />
    </svg>
  )
}
