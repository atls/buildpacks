import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  componentStatus,
  releaseEligibility,
  releasePlan,
  renderBuilderConfig,
  trivyMetadata,
  promotionPlan,
} from './ghcr-release.mjs'

test('release plan exposes node lines, temporary tags and scan rows', () => {
  const plan = releasePlan({ sha: '1234567890abcdef' })

  assert.equal(plan.default_node_major, '26')
  assert.deepEqual(plan.node_lines, [
    {
      node_major: '24',
      release_tag: '24-1234567890ab',
    },
    {
      node_major: '26',
      release_tag: '26-1234567890ab',
    },
  ])
  assert.equal(plan.base_image, 'mcr.microsoft.com/devcontainers/base:debian-12')
  assert.equal(plan.scan_matrix.length, 16)
})

test('terraform workflow-only change is not releaseable', () => {
  const result = releaseEligibility({
    actor: 'atlantis-terraformer-bot[bot]',
    changedFiles: '.github/workflows/docker-release.yaml',
    sha: 'HEAD',
    config: 'scripts/ghcr-release.config.json',
  })

  assert.equal(result.release_enabled, false)
  assert.equal(result.reason, 'terraform-managed-workflow-only-change')
})

test('component status resolves current buildpack image without remote check', () => {
  const result = componentStatus({
    kind: 'buildpack',
    directory: 'buildpacks/yarn-workspace',
    imageRepository: 'ghcr.io/atls/buildpack-yarn-workspace',
  })

  assert.match(result.version, /^\d+\.\d+\.\d+$/)
  assert.equal(result.image, `ghcr.io/atls/buildpack-yarn-workspace:${result.version}`)
})

test('builder config renders release stack refs without changing source file', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'builder-config-'))
  try {
    const output = join(tempDir, 'builder.toml')
    const result = renderBuilderConfig({
      releaseTag: '26-1234567890ab',
      output,
    })
    const rendered = readFileSync(output, 'utf8')

    assert.equal(result.output, output)
    assert.match(rendered, /ghcr\.io\/atls\/stack-node:build-26-1234567890ab/)
    assert.match(rendered, /ghcr\.io\/atls\/stack-node:run-26-1234567890ab/)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('trivy metadata and promotion plan keep the published image contract', () => {
  const metadata = trivyMetadata({
    imageKind: 'stack-node-build',
    nodeMajor: '26',
    platform: 'linux/amd64',
    releaseTag: '26-1234567890ab',
  })
  const promotion = promotionPlan({
    nodeMajor: '26',
    releaseTag: '26-1234567890ab',
    defaultNodeMajor: '26',
  })

  assert.equal(metadata.image, 'ghcr.io/atls/stack-node:build-26-1234567890ab')
  assert.equal(metadata.sarif, 'trivy-stack-node-build-26-1234567890ab-linux-amd64.sarif')
  assert.deepEqual(promotion.manifests[1].tags, [
    'ghcr.io/atls/stack-node:build-26',
    'ghcr.io/atls/stack-node:build',
  ])
})
