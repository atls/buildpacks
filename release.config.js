import { createRequire } from 'node:module'

const conventionalCommitsConfigPath = createRequire(import.meta.url).resolve(
  'conventional-changelog-conventionalcommits'
)

export default {
  branches: ['master'],
  tagFormat: `buildpack-root-\${version}`,
  plugins: [
    ['@semantic-release/commit-analyzer', { config: conventionalCommitsConfigPath }],
    ['@semantic-release/release-notes-generator', { config: conventionalCommitsConfigPath }],
    [
      '@semantic-release/exec',
      {
        verifyReleaseCmd: `echo "version=\${nextRelease.version}" >> "$GITHUB_OUTPUT" && { test -z "$RELEASE_VERSION" || test "$RELEASE_VERSION" = "\${nextRelease.version}"; }`,
        successCmd: 'echo "released=true" >> "$GITHUB_OUTPUT"',
      },
    ],
    [
      '@semantic-release/github',
      { successComment: false, failComment: false, releasedLabels: false },
    ],
  ],
}
