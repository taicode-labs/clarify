import {
  applyConfiguredPageRoutePaths,
  buildLocalizedNavigationFromTabsConfig,
  buildNavigation,
  buildNavigationFromTabsConfig,
} from '../../parsers/routes/routes.js'
import type { ClarifyPlugin } from '../../types.js'

/**
 * Navigation plugin: builds the navigation tree from resolved routes.
 *
 * Runs in the `routes:resolved` pipeline hook. Receives `{ routes, navigation }`
 * where navigation is empty, and fills in the navigation tree based on the
 * project's tabs configuration (or auto-generated from the file tree when no
 * tabs are configured). Also applies configured page route path overrides
 * (`applyConfiguredPageRoutePaths`) before building navigation.
 *
 * Runs with `enforce: 'post'` so it executes after other plugins have had a
 * chance to filter or augment routes.
 */
export function createNavigationPlugin(): ClarifyPlugin {
  return {
    name: 'clarify:navigation',
    enforce: 'post',
    hooks: {
      'routes:resolved': (input, ctx) => {
        const { tabs, i18n } = ctx.projectConfig
        const routes = applyConfiguredPageRoutePaths(input.routes, tabs, i18n)

        const navigation = tabs
          ? i18n
            ? (buildLocalizedNavigationFromTabsConfig(routes, tabs, i18n) ?? {})
            : buildNavigationFromTabsConfig(routes, tabs)
          : buildNavigation(routes)

        return { routes, navigation }
      },
    },
  }
}
