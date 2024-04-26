import webpack from 'webpack'

export async function compile(
  scriptFile: string,
  folderTarget: string,
  ...resolveModule: string[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    webpack(
      {
        dependencies: [],
        entry: scriptFile,
        target: 'node',
        module: {
          rules: [
            {
              test: /\.tsx?$/,
              use: 'ts-loader',
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
              .reduce((errorText, errorEntry) => `${errorText}\n${errorEntry}`, '')
          )
        } else {
          resolve()
        }
      }
    )
  })
}
