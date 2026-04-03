# Changesets

This repo uses Changesets for release management.

Typical maintainer flow:

1. Make normal commits to `main` without publishing.
2. For a user-facing change, run `npm run changeset` and choose the version bump.
3. Commit the generated markdown file in this folder.
4. The Changesets GitHub workflow will open or update a release PR.
5. Merging that release PR bumps the package version and publishes to npm.
