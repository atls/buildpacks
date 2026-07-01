import assert              from 'node:assert/strict'
import { mkdtemp }         from 'node:fs/promises'
import { rm }              from 'node:fs/promises'
import { writeFile }       from 'node:fs/promises'
import { tmpdir }          from 'node:os'
import { join }            from 'node:path'
import { test }            from 'node:test'

import { BuildpackConfig } from '../buildpack.js'

const createTempDir = async (): Promise<string> => mkdtemp(join(tmpdir(), 'libcnb-'))

test('BuildpackConfig parses buildpack.toml into the normalized config shape', async () => {
  const rootDir = await createTempDir()

  try {
    await writeFile(
      join(rootDir, 'buildpack.toml'),
      [
        'api = "0.10"',
        '',
        '[buildpack]',
        'id = "tech.atls.buildpacks.fixture"',
        'version = "1.2.3"',
        'name = "Fixture"',
        'homepage = "https://example.com"',
        'clear-env = true',
        'description = "Fixture buildpack"',
        'keywords = ["node", "yarn"]',
        '',
        '[[buildpack.licenses]]',
        'type = "BSD-3-Clause"',
        'uri = "https://example.com/license"',
        '',
        '[[stacks]]',
        'id = "tech.atls.stacks.node"',
        'mixins = ["ca-certificates"]',
        '',
        '[[targets]]',
        'os = "linux"',
        'arch = "amd64"',
        '',
        '[[targets]]',
        'os = "linux"',
        'distro.name = "ubuntu"',
        'distro.version = "24.04"',
        '',
        '[metadata]',
        'owner = "atls"',
        '',
        '[metadata.flags]',
        'strict = true',
        '',
        '[[order]]',
        '[[order.group]]',
        'id = "tech.atls.buildpacks.yarn-install"',
        'version = "1.0.0"',
        'optional = true',
        '',
      ].join('\n')
    )

    const buildpack = await BuildpackConfig.fromPath(rootDir)

    assert.equal(buildpack.api, '0.10')
    assert.equal(buildpack.info.id, 'tech.atls.buildpacks.fixture')
    assert.equal(buildpack.info.version, '1.2.3')
    assert.equal(buildpack.info.clearEnv, true)
    assert.deepEqual(buildpack.info.keywords, ['node', 'yarn'])
    assert.deepEqual(buildpack.metadata, {
      flags: {
        strict: true,
      },
      owner: 'atls',
    })
    assert.equal(buildpack.stacks[0].id, 'tech.atls.stacks.node')
    assert.deepEqual(buildpack.stacks[0].mixins, ['ca-certificates'])
    assert.equal(buildpack.targets[0].os, 'linux')
    assert.equal(buildpack.targets[0].arch, 'amd64')
    assert.equal(buildpack.targets[1].os, 'linux')
    assert.equal(buildpack.targets[1].arch, '')
    assert.deepEqual(buildpack.targets[1].metadata, {
      distro: {
        name: 'ubuntu',
        version: '24.04',
      },
      os: 'linux',
    })
    assert.equal(buildpack.order[0].group[0].optional, true)
  } finally {
    await rm(rootDir, { recursive: true, force: true })
  }
})
