import { renderToString } from 'react-dom/server'

import App from './App'
import './i18n'

export function render(pathname: string) {
  return renderToString(<App path={pathname} />)
}
