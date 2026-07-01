import assert             from 'node:assert/strict'
import { mkdtemp }        from 'node:fs/promises'
import { rm }             from 'node:fs/promises'
import { tmpdir }         from 'node:os'
import { join }           from 'node:path'
import { test }           from 'node:test'

import { BOMEntry }       from '../bom.js'
import { BuildFile }      from '../build.js'
import { Label }          from '../label.js'
import { LaunchFile }     from '../launch.js'
import { Process }        from '../process.js'
import { Slice }          from '../slice.js'
import { UnmetPlanEntry } from '../unmet.js'

const createTempDir = async (): Promise<string> => mkdtemp(join(tmpdir(), 'libcnb-'))

test('LaunchFile and BuildFile roundtrip through CNB lifecycle files', async () => {
  const rootDir = await createTempDir()
  const launchPath = join(rootDir, 'launch.toml')
  const buildPath = join(rootDir, 'build.toml')

  try {
    const launchFile = new LaunchFile(
      [new Label('io.buildpacks.stack.id', 'tech.atls.stacks.node')],
      [
        new Process('web', ['node', 'server.js'], ['--port', '3000'], true, 'services/api', [
          'production',
        ]),
      ],
      [new Slice(['dist'])],
      [new BOMEntry('node', { version: '26' })]
    )
    const buildFile = new BuildFile(
      [new BOMEntry('yarn', { version: '4.14.1' })],
      [new UnmetPlanEntry('node')]
    )

    await launchFile.toPath(launchPath)
    await buildFile.toPath(buildPath)

    assert.deepEqual(await LaunchFile.fromPath(launchPath), launchFile)
    assert.deepEqual(await BuildFile.fromPath(buildPath), buildFile)
  } finally {
    await rm(rootDir, { recursive: true, force: true })
  }
})
