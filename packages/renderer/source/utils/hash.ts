export function encodeHashId(id: string): string {
  return encodeURIComponent(id)
}

export function decodeHashId(hash: string): string {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash

  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}
