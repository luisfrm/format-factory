# Pull requests

The repository is open. Anyone can fork it, change it and send a pull request.
Nobody can merge except the maintainer.

## For contributors

1. Fork the repository.
2. Create a branch from `master`:
   `feat/drag-to-reorder`, `fix/eta-negative`.
3. Make the change. Keep it focused.
4. Commit using Conventional Commits:

   ```
   feat(queue): allow reordering by dragging
   fix(ui): correct ETA when duration is unknown
   docs: explain macOS requirements
   ```

   Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`,
   `perf`, `build`.

5. Open the PR against `master` and fill the template.
6. Wait for CI. It builds Windows, Linux and macOS, and runs both test suites.

## What CI checks on a PR

| Check | What it means |
|---|---|
| Resolve version | Reads `package.json`; on PRs it never publishes |
| Dependency audit | `pnpm audit` — informational |
| Windows x64 / Linux x64 / macOS arm64 | The app compiles, tests pass and the installer builds on that OS |
| Review dependencies | No new dependency with a high severity advisory |

A PR cannot be merged until these pass and the code owner approves.

## For the maintainer

1. Read the diff, not just the title.
2. Check the dependency review if the PR adds packages.
3. If it touches `.github/workflows/`, read it twice. A workflow change is code
   that runs with a token.
4. Squash or rebase so `master` stays linear and the history keeps conventional
   commit messages.
5. The branch is deleted after merge.

Expected review points:

- New logic has tests.
- No new dependency without a reason in the PR body.
- UI changes include a screenshot.
- No binaries, installers or secrets.
- Animations respect `prefers-reduced-motion`.

## What gets rejected

- "While I was there" refactors mixed with a fix.
- A new library that duplicates something already installed.
- Changes that only reformat files.
- Anything that weakens CI permissions or skips a check.

## After merge

Nothing is released automatically. A merge only updates `master`; publishing
needs a version change. See [release.md](./release.md).

## Dependabot PRs

They arrive weekly. Treat them like any other PR:

1. Wait for the checks. Do not merge while they are still queued.
2. For `github-actions` updates, the diff should only change SHAs.
3. For `npm`/`cargo` updates, read the changelog of the bumped package.
4. Merge one at a time. Three dependency PRs merged together are hard to debug
   if something breaks.
