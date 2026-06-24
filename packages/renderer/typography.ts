import { type Config } from 'tailwindcss'

export default {
  theme: {
    typography: ({ theme }) => ({
      DEFAULT: {
        css: {
          '--tw-prose-body': 'color-mix(in srgb, var(--clarify-theme-tokens-colors-foreground) 60%, var(--clarify-theme-tokens-colors-muted))',
          '--tw-prose-headings': 'var(--clarify-theme-tokens-colors-foreground)',
          '--tw-prose-links': 'var(--clarify-theme-tokens-colors-primary)',
          '--tw-prose-links-hover': 'var(--clarify-theme-tokens-colors-accent)',
          '--tw-prose-links-underline': 'color-mix(in srgb, var(--clarify-theme-tokens-colors-primary) 30%, transparent)',
          '--tw-prose-bold': 'var(--clarify-theme-tokens-colors-foreground)',
          '--tw-prose-counters': 'var(--clarify-theme-tokens-colors-muted)',
          '--tw-prose-bullets': 'color-mix(in srgb, var(--clarify-theme-tokens-colors-muted) 35%, transparent)',
          '--tw-prose-hr': 'color-mix(in srgb, var(--clarify-theme-tokens-colors-border) 65%, transparent)',
          '--tw-prose-quotes': 'var(--clarify-theme-tokens-colors-foreground)',
          '--tw-prose-quote-borders': 'var(--clarify-theme-tokens-colors-border)',
          '--tw-prose-captions': 'var(--clarify-theme-tokens-colors-muted)',
          '--tw-prose-code': 'var(--clarify-theme-tokens-colors-foreground)',
          '--tw-prose-code-bg': 'var(--clarify-theme-tokens-colors-code-background)',
          '--tw-prose-code-ring': 'var(--clarify-theme-tokens-colors-border)',
          '--tw-prose-th-borders': 'var(--clarify-theme-tokens-colors-border)',
          '--tw-prose-td-borders': 'color-mix(in srgb, var(--clarify-theme-tokens-colors-border) 80%, transparent)',

          '--tw-prose-invert-body': 'var(--clarify-ui-text-soft)',
          '--tw-prose-invert-headings': 'var(--clarify-ui-text-strong)',
          '--tw-prose-invert-links': 'var(--clarify-ui-accent-text)',
          '--tw-prose-invert-links-hover': 'var(--clarify-theme-tokens-colors-accent)',
          '--tw-prose-invert-links-underline': 'color-mix(in srgb, var(--clarify-theme-tokens-colors-accent) 35%, transparent)',
          '--tw-prose-invert-bold': 'var(--clarify-ui-text-strong)',
          '--tw-prose-invert-counters': 'var(--clarify-ui-text-faint)',
          '--tw-prose-invert-bullets': 'color-mix(in srgb, var(--clarify-theme-tokens-colors-foreground) 28%, transparent)',
          '--tw-prose-invert-hr': 'color-mix(in srgb, var(--clarify-theme-tokens-colors-border) 70%, transparent)',
          '--tw-prose-invert-quotes': 'var(--clarify-ui-text)',
          '--tw-prose-invert-quote-borders': 'var(--clarify-theme-tokens-colors-border)',
          '--tw-prose-invert-captions': 'var(--clarify-ui-text-faint)',
          '--tw-prose-invert-code': 'var(--clarify-ui-text-strong)',
          '--tw-prose-invert-code-bg': 'var(--clarify-theme-tokens-colors-code-background)',
          '--tw-prose-invert-code-ring': 'var(--clarify-theme-tokens-colors-border)',
          '--tw-prose-invert-th-borders': 'var(--clarify-theme-tokens-colors-border)',
          '--tw-prose-invert-td-borders': 'color-mix(in srgb, var(--clarify-theme-tokens-colors-border) 78%, transparent)',

          color: 'var(--tw-prose-body)',
          fontSize: '0.9375rem',
          lineHeight: '1.625rem',

          p: {
            marginTop: theme('spacing.6'),
            marginBottom: theme('spacing.6'),
          },
          '[class~="lead"]': {
            fontSize: theme('fontSize.base')[0],
            ...theme('fontSize.base')[1],
          },

          ol: {
            listStyleType: 'decimal',
            marginTop: theme('spacing.5'),
            marginBottom: theme('spacing.5'),
            paddingLeft: '1.625rem',
          },
          ul: {
            listStyleType: 'disc',
            marginTop: theme('spacing.5'),
            marginBottom: theme('spacing.5'),
            paddingLeft: '1.625rem',
          },
          li: {
            marginTop: theme('spacing.2'),
            marginBottom: theme('spacing.2'),
          },
          ':is(ol, ul) > li': {
            paddingLeft: theme('spacing[1.5]'),
          },
          'ol > li::marker': {
            fontWeight: '400',
            color: 'var(--tw-prose-counters)',
          },
          'ul > li::marker': {
            color: 'var(--tw-prose-bullets)',
          },
          'ul ul, ul ol, ol ul, ol ol': {
            marginTop: theme('spacing.3'),
            marginBottom: theme('spacing.3'),
          },

          hr: {
            borderColor: 'var(--tw-prose-hr)',
            borderTopWidth: 1,
            marginTop: theme('spacing.8'),
            marginBottom: theme('spacing.8'),
            maxWidth: 'none',
            marginLeft: `calc(-1 * ${theme('spacing.4')})`,
            marginRight: `calc(-1 * ${theme('spacing.4')})`,
          },

          blockquote: {
            fontWeight: '500',
            fontStyle: 'italic',
            color: 'var(--tw-prose-quotes)',
            borderLeftWidth: '0.25rem',
            borderLeftColor: 'var(--tw-prose-quote-borders)',
            quotes: '"\\201C""\\201D""\\2018""\\2019"',
            marginTop: theme('spacing.8'),
            marginBottom: theme('spacing.8'),
            paddingLeft: theme('spacing.5'),
          },
          'blockquote p:first-of-type::before': {
            content: 'open-quote',
          },
          'blockquote p:last-of-type::after': {
            content: 'close-quote',
          },

          h1: {
            color: 'var(--tw-prose-headings)',
            fontWeight: '700',
            fontSize: theme('fontSize.2xl')[0],
            ...theme('fontSize.2xl')[1],
            letterSpacing: theme('letterSpacing.tight'),
            marginBottom: theme('spacing.3'),
          },
          h2: {
            color: 'var(--tw-prose-headings)',
            fontWeight: '600',
            fontSize: '1.0625rem',
            lineHeight: '1.625rem',
            marginTop: theme('spacing.16'),
            marginBottom: theme('spacing.2'),
          },
          h3: {
            color: 'var(--tw-prose-headings)',
            fontSize: theme('fontSize.sm')[0],
            ...theme('fontSize.sm')[1],
            fontWeight: '600',
            marginTop: theme('spacing.10'),
            marginBottom: theme('spacing.2'),
          },

          'img, video, figure': {
            marginTop: theme('spacing.8'),
            marginBottom: theme('spacing.8'),
          },
          figcaption: {
            color: 'var(--tw-prose-captions)',
            fontSize: theme('fontSize.xs')[0],
            ...theme('fontSize.xs')[1],
            marginTop: theme('spacing.2'),
          },

          table: {
            width: '100%',
            tableLayout: 'auto',
            textAlign: 'left',
            marginTop: theme('spacing.8'),
            marginBottom: theme('spacing.8'),
            lineHeight: theme('lineHeight.6'),
          },
          thead: {
            borderBottomWidth: '1px',
            borderBottomColor: 'var(--tw-prose-th-borders)',
          },
          'thead th': {
            color: 'var(--tw-prose-headings)',
            fontWeight: '600',
            verticalAlign: 'bottom',
            paddingRight: theme('spacing.2'),
            paddingBottom: theme('spacing.2'),
            paddingLeft: theme('spacing.2'),
          },
          'tbody tr': {
            borderBottomWidth: '1px',
            borderBottomColor: 'var(--tw-prose-td-borders)',
          },
          ':is(tbody, tfoot) td': {
            paddingTop: theme('spacing.2'),
            paddingRight: theme('spacing.2'),
            paddingBottom: theme('spacing.2'),
            paddingLeft: theme('spacing.2'),
          },

          a: {
            color: 'var(--tw-prose-links)',
            textDecoration: 'underline',
            textDecorationColor: 'var(--tw-prose-links-underline)',
            fontWeight: 'normal',
            transitionProperty: 'color, text-decoration-color',
            transitionDuration: theme('transitionDuration.DEFAULT'),
            transitionTimingFunction: theme('transitionTimingFunction.DEFAULT'),
            '&:hover': {
              color: 'var(--tw-prose-links-hover)',
              textDecorationColor: 'var(--tw-prose-links-underline)',
            },
          },
          strong: {
            color: 'var(--tw-prose-bold)',
            fontWeight: '600',
          },
          code: {
            color: 'var(--tw-prose-code)',
            borderRadius: 'var(--clarify-theme-tokens-radius-lg)',
            paddingTop: theme('padding.1'),
            paddingRight: theme('padding[1.5]'),
            paddingBottom: theme('padding.1'),
            paddingLeft: theme('padding[1.5]'),
            boxShadow: 'inset 0 0 0 1px var(--tw-prose-code-ring)',
            backgroundColor: 'var(--tw-prose-code-bg)',
            fontSize: theme('fontSize.2xs')[0],
          },
          ':is(a, h1, h2, h3, blockquote, thead th) code': {
            color: 'inherit',
          },
          ':is(h1, h2, h3) + *': {
            marginTop: '0',
          },
          '> h1:first-child + p': {
            color: 'var(--clarify-ui-text-soft)',
            fontSize: theme('fontSize.base')[0],
            ...theme('fontSize.base')[1],
          },
          '> :first-child': {
            marginTop: '0 !important',
          },
          '> :last-child': {
            marginBottom: '0 !important',
          },
        },
      },
      invert: {
        css: {
          '--tw-prose-body': 'var(--tw-prose-invert-body)',
          '--tw-prose-headings': 'var(--tw-prose-invert-headings)',
          '--tw-prose-links': 'var(--tw-prose-invert-links)',
          '--tw-prose-links-hover': 'var(--tw-prose-invert-links-hover)',
          '--tw-prose-links-underline': 'var(--tw-prose-invert-links-underline)',
          '--tw-prose-bold': 'var(--tw-prose-invert-bold)',
          '--tw-prose-counters': 'var(--tw-prose-invert-counters)',
          '--tw-prose-bullets': 'var(--tw-prose-invert-bullets)',
          '--tw-prose-hr': 'var(--tw-prose-invert-hr)',
          '--tw-prose-quotes': 'var(--tw-prose-invert-quotes)',
          '--tw-prose-quote-borders': 'var(--tw-prose-invert-quote-borders)',
          '--tw-prose-captions': 'var(--tw-prose-invert-captions)',
          '--tw-prose-code': 'var(--tw-prose-invert-code)',
          '--tw-prose-code-bg': 'var(--tw-prose-invert-code-bg)',
          '--tw-prose-code-ring': 'var(--tw-prose-invert-code-ring)',
          '--tw-prose-th-borders': 'var(--tw-prose-invert-th-borders)',
          '--tw-prose-td-borders': 'var(--tw-prose-invert-td-borders)',
        },
      },
    }),
  },
} satisfies Config
