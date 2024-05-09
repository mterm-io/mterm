import webpack from 'webpack'
import { rootPath } from 'electron-root-path'
import { join } from 'path'
export async function compile(
  scriptFile: string,
  folderTarget: string,
  ...resolveModule: string[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const linux = process.platform === 'linux'
    const darwin: boolean = process.platform === 'darwin'
    //'/Applications/mterm.app/node_modules/ts-loader
    const mac_node_modules = join(rootPath, 'Contents', 'node_modules', 'ts-loader')
    const linux_node_modules = join('opt', 'mterm', 'node_modules', 'ts-loader')
    const windows_node_modules = './node_modules/ts-loader'

    webpack(
      {
        dependencies: [],
        entry: scriptFile,
        target: 'node',
        module: {
          rules: [
            {
              test: /\.tsx?$/,
              use: linux ? linux_node_modules : darwin ? mac_node_modules : windows_node_modules,
              exclude: /node_modules/
            }
          ]
        },
        resolve: {
          extensions: ['.tsx', '.ts', '.js'],
          modules: resolveModule
        },
        output: {
          filename: 'commands.js',
          path: folderTarget,
          library: {
            name: 'lib',
            type: 'assign-properties'
          }
        }
      },
      (err, stats) => {
        if (err) {
          reject(err)
        } else if (stats?.hasErrors()) {
          console.error(stats.toJson())
          reject(
            stats
              .toJson()
              .errors?.map((o) => o.message)
              .reduce(
                (errorText, errorEntry) => `${errorText}\n${errorEntry.split('TS').join('\nTS')}`,
                ''
              )
          )
        } else {
          resolve()
        }
      }
    )
  })
}
