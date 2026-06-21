import packageJson from '../../package.json' with { type: 'json' }

export const cliPackageJson = packageJson as { version?: string }
export const cliPackageVersion = cliPackageJson.version ?? '0.0.0'
export const cliPackageVersionWithCaret = `^${cliPackageVersion}`

export function readPackageVersion(): string {
  return cliPackageVersion
}
