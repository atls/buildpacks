import assert       from 'node:assert/strict'
import { mkdtemp }  from 'node:fs/promises'
import { readFile } from 'node:fs/promises'
import { rm }       from 'node:fs/promises'
import { tmpdir }   from 'node:os'
import { join }     from 'node:path'
import { test }     from 'node:test'

import { Layer }    from '../entry.js'
import { Store }    from '../store.js'

const createTempDir = async (): Promise<string> => mkdtemp(join(tmpdir(), 'libcnb-'))

test('Layer and Store persist typed metadata and environment files', async () => {
  const rootDir = await createTempDir()
  const layerPath = join(rootDir, 'layers/node-options')
  const storePath = join(rootDir, 'layers/store.toml')

  try {
    const layer = new Layer(layerPath)

    assert.equal(layer.name, 'node-options')

    layer.build = true
    layer.launch = true
    layer.setMetadata('locksum', 'abc123')
    layer.setMetadata('exec-env', ['production'])
    layer.setMetadata('checksum', { sha: 'abc123' })
    layer.launchEnv.append('NODE_OPTIONS', '--enable-source-maps')

    await layer.dump()
    await new Store({ node: '26' }).toPath(storePath)

    const loadedLayer = new Layer(layerPath)

    await loadedLayer.load()

    assert.equal(loadedLayer.build, true)
    assert.equal(loadedLayer.cache, false)
    assert.equal(loadedLayer.launch, true)
    assert.equal(loadedLayer.getMetadata('locksum'), 'abc123')
    assert.deepEqual(loadedLayer.getMetadata('exec-env'), ['production'])
    assert.deepEqual(loadedLayer.getMetadata('checksum'), { sha: 'abc123' })
    assert.equal(
      await readFile(join(layerPath, 'env.launch/NODE_OPTIONS.append'), 'utf-8'),
      '--enable-source-maps'
    )
    assert.deepEqual(await Store.fromPath(storePath), new Store({ node: '26' }))
  } finally {
    await rm(rootDir, { recursive: true, force: true })
  }
})
