import { renderToString } from 'react-dom/server'

import App from './App'

export function render(pathname: string) {
  return renderToString(<App path={pathname} />)
}
