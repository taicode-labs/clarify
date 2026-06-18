import clsx from 'clsx'

import type { ClarifyLogoConfig } from '../types'

export type SiteLogoProps = {
  logo?: ClarifyLogoConfig
  className?: string
}

export function SiteLogo(arg0: SiteLogoProps) {  const { logo, className } = arg0
  if (!logo) return null

  if (typeof logo === 'string') {
    return <img src={logo} alt="" className={className} />
  }

  const lightLogo = logo.light ?? logo.dark
  const darkLogo = logo.dark ?? logo.light

  if (!lightLogo || !darkLogo) return null
  if (lightLogo === darkLogo) {
    return <img src={lightLogo} alt="" className={className} />
  }

  return (
    <>
      <img src={lightLogo} alt="" className={clsx(className, 'dark:hidden')} />
      <img src={darkLogo} alt="" className={clsx(className, 'hidden dark:block')} />
    </>
  )
}
