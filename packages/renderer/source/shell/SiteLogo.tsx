import clsx from 'clsx'

import type { LogoConfig } from '../core/types'

export type SiteLogoProps = {
  logo?: LogoConfig
  className?: string
}

export function SiteLogo(arg0: SiteLogoProps) {  const { logo, className } = arg0
  if (!logo) return null

  if (typeof logo === 'string') {
    return <img src={logo} alt="" className={clsx('clarify-logo', className)} />
  }

  const lightLogo = logo.light ?? logo.dark
  const darkLogo = logo.dark ?? logo.light

  if (!lightLogo || !darkLogo) return null
  if (lightLogo === darkLogo) {
    return <img src={lightLogo} alt="" className={clsx('clarify-logo', className)} />
  }

  return (
    <>
      <img src={lightLogo} alt="" className={clsx('clarify-logo clarify-logo-light', className, 'dark:hidden')} />
      <img src={darkLogo} alt="" className={clsx('clarify-logo clarify-logo-dark', className, 'hidden dark:block')} />
    </>
  )
}
