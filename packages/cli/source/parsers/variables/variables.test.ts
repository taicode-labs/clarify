import { describe, expect, it } from 'vitest'

import { applyVariables } from '../../../../variables.js'

describe('applyVariables', () => {
  it('replaces top-level and nested variables', () => {
    expect(applyVariables('Use {{ product.name }} {{ version }} at {{ links.support }}.', {
      product: { name: 'Clarify' },
      version: '0.8.0',
      links: { support: 'https://clarify.pub/support' },
    })).toBe('Use Clarify 0.8.0 at https://clarify.pub/support.')
  })

  it('stringifies primitive values', () => {
    expect(applyVariables('Version {{ version }} stable={{ stable }}.', {
      version: 8,
      stable: true,
    })).toBe('Version 8 stable=true.')
  })

  it('leaves unknown and object variables unchanged', () => {
    expect(applyVariables('{{ missing }} {{ product }}', {
      product: { name: 'Clarify' },
    })).toBe('{{ missing }} {{ product }}')
  })

  it('resolves variables that reference other variables', () => {
    expect(applyVariables('{{ support }}', {
      domain: 'clarify.pub',
      support: 'https://{{ domain }}/support',
    })).toBe('https://clarify.pub/support')
  })

  it('throws on circular references', () => {
    expect(() => applyVariables('{{ first }}', {
      first: '{{ second }}',
      second: '{{ first }}',
    })).toThrow('[clarify] variable "first" contains a circular reference: first -> second -> first')
  })
})
