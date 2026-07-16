import { create } from 'zustand'

type OpenApiState = {
  credentials: Record<string, Record<string, string>>
  setCredential: (scope: string, name: string, value: string) => void
  clearCredential: (scope: string, name: string) => void
  clearCredentials: (scope: string) => void
}

const credentialScopes = new WeakMap<object, string>()
export const emptyOpenApiCredentials: Readonly<Record<string, string>> = Object.freeze({})
let nextCredentialScope = 0

export function getOpenApiCredentialScope(spec: object): string {
  const current = credentialScopes.get(spec)
  if (current) return current
  const scope = `openapi-${nextCredentialScope += 1}`
  credentialScopes.set(spec, scope)
  return scope
}

export const useOpenApiStore = create<OpenApiState>()((set) => ({
  credentials: {},
  setCredential: (scope, name, value) => set((state) => ({
    credentials: {
      ...state.credentials,
      [scope]: { ...state.credentials[scope], [name]: value },
    },
  })),
  clearCredential: (scope, name) => set((state) => {
    const scoped = { ...state.credentials[scope] }
    delete scoped[name]
    return { credentials: { ...state.credentials, [scope]: scoped } }
  }),
  clearCredentials: (scope) => set((state) => {
    const credentials = { ...state.credentials }
    delete credentials[scope]
    return { credentials }
  }),
}))
