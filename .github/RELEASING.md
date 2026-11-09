# Releasing

Releases are driven by the [`Release`](./workflows/release.yaml) workflow. It bumps every
workspace manifest in lockstep, validates the repository, commits the version bump, pushes the
release tag, creates the GitHub release and then triggers [`Publish`](./workflows/publish.yaml).

## Cutting a release

1. Open **Actions → Release → Run workflow** on `main`.
2. Fill in the inputs:
   - `version` — the version to release (for example `0.11.24`). A leading `v` is stripped; release tags never carry a `v` prefix so the tag matches `package.json` verbatim.
   - `prerelease` — create a pre-release and skip npm publishing.
   - `dry_run` — bump and validate without committing, tagging, releasing or publishing.
3. Run the workflow.

The same thing can be done from the command line:

```bash
gh workflow run release.yaml --ref main -f version=0.11.24
```

## What the workflow does

```mermaid
flowchart LR
  A[bump-version.mjs] --> B[lint / typecheck / test / build]
  B --> C[commit chore release]
  C --> D[push tag X.Y.Z]
  D --> E[create GitHub release]
  E --> F[dispatch Publish]
```

`Publish` waits for the `verify` job (which re-checks the tag against every `package.json`), then
publishes `@clarify-labs/renderer`, `@clarify-labs/templates` and `@clarify-labs/cli` to npm via
OIDC trusted publishing, and uploads the `.vsix` asset to the GitHub release.

## Notes

- Release tags are plain semver (`0.11.24`, never `v0.11.24`) so the tag, `package.json` and npm dist-tags all agree.
- All eight `package.json` files must share the same version. Use
  `node scripts/bump-version.mjs <version>` locally to bump them and
  `node scripts/bump-version.mjs --check <version>` to verify.
- Releases created with `GITHUB_TOKEN` do not trigger `release: published` workflows, which is why
  `Release` explicitly dispatches `Publish` instead of relying on the release event.
- `Publish` is also exposed as `workflow_dispatch` so a failed pipeline can be retried without
  recreating the release: `gh workflow run publish.yaml --ref main -f tag=0.11.24`.
