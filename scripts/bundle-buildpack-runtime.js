import { resolve } from 'node:path'

import { webpack } from '@atls/raijin/webpack'

const [entry, directory] = process.argv.slice(2)

if (!entry || !directory) {
  throw new Error('usage: bundle-buildpack-runtime.js <entry> <directory>')
}

const banner = [
  "import { createRequire } from 'node:module'",
  "import { fileURLToPath } from 'node:url'",
  'const require = createRequire(import.meta.url)',
  'const __filename = fileURLToPath(import.meta.url)',
].join('\n')

await new Promise((done, fail) => {
  webpack(
    {
      mode: 'production',
      target: 'node',
      entry: resolve(entry),
      experiments: { outputModule: true },
      externalsPresets: { node: true },
      output: {
        path: resolve(directory),
        filename: 'index.js',
        library: { type: 'module' },
        module: true,
        chunkFormat: 'module',
        clean: true,
      },
      plugins: [new webpack.BannerPlugin({ banner, raw: true, entryOnly: true })],
    },
    (error, stats) => {
      if (error) {
        fail(error)
      } else if (!stats || stats.hasErrors()) {
        fail(
          new Error(stats?.toString({ all: false, errors: true }) || 'Webpack emitted no result')
        )
      } else {
        done()
      }
    }
  )
})
