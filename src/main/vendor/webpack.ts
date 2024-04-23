import webpack from 'webpack'

export async function compile(scriptFile: string, scriptFileCompiled: string): Promise<void> {
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
          extensions: ['.tsx', '.ts', '.js']
        },
        output: {
          filename: 'commands.js',
          path: scriptFileCompiled,
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
          reject(stats.toJson().errors)
        } else {
          resolve()
        }
      }
    )
  })
}
