import assert             from 'node:assert/strict'
import { mkdtemp }        from 'node:fs/promises'
import { rm }             from 'node:fs/promises'
import { tmpdir }         from 'node:os'
import { join }           from 'node:path'
import { test }           from 'node:test'

import { Store }          from '../../layers/store.js'
import { BOMEntry }       from '../../lifecycle/bom.js'
import { BuildFile }      from '../../lifecycle/build.js'
import { Label }          from '../../lifecycle/label.js'
import { LaunchFile }     from '../../lifecycle/launch.js'
import { Slice }          from '../../lifecycle/slice.js'
import { UnmetPlanEntry } from '../../lifecycle/unmet.js'
import { BuildResult }    from '../result.js'

const createTempDir = async (): Promise<string> => mkdtemp(join(tmpdir(), 'libcnb-'))

test('BuildResult writes explicit lifecycle outputs', async () => {
  const rootDir = await createTempDir()

  try {
    const result = new BuildResult()
      .setStoreMetadata('node', '26')
      .addLaunchLabel('io.buildpacks.stack.id', 'tech.atls.stacks.node')
      .addLaunchSlice(['dist'])
      .addLaunchBOM('node', { version: '26' })
      .addBuildBOM('yarn', { version: '4.14.1' })
      .addUnmetPlanEntry('node')

    await result.toPath(rootDir)

    assert.deepEqual(await Store.fromPath(join(rootDir, 'store.toml')), new Store({ node: '26' }))
    assert.deepEqual(
      await LaunchFile.fromPath(join(rootDir, 'launch.toml')),
      new LaunchFile(
        [new Label('io.buildpacks.stack.id', 'tech.atls.stacks.node')],
        [],
        [new Slice(['dist'])],
        [new BOMEntry('node', { version: '26' })]
      )
    )
    assert.deepEqual(
      await BuildFile.fromPath(join(rootDir, 'build.toml')),
      new BuildFile([new BOMEntry('yarn', { version: '4.14.1' })], [new UnmetPlanEntry('node')])
    )
  } finally {
    await rm(rootDir, { recursive: true, force: true })
  }
})
