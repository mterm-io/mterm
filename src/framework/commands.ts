import { mkdirs, pathExists, readFile, readJson, writeFile, writeJson } from 'fs-extra'
import webpack from 'webpack'
import { tmpdir } from 'node:os'
import { join } from 'path'
import short from 'short-uuid'
import { runInNewContext } from 'node:vm'
import * as tryRequire from 'try-require'

function compile(scriptFile: string, scriptFileCompiled: string): Promise<void> {
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
        } else {
          if (stats?.hasErrors()) {
            const o = stats.toJson()

            console.error(o.errors)
            console.log(o.warnings)

            reject(o.errors)
          } else {
            resolve()
          }
        }
      }
    )
  })
}

export class Commands {
  public lib: object = {}
  constructor(
    private workingDirectory: string,
    private templateDirectory: string
  ) {}

  require(path: string): unknown {
    return tryRequire.default(path)
  }

  async load(): Promise<void> {
    const packageJsonLocation = join(this.workingDirectory, './package.json')
    const isExistPackageJson = await pathExists(join(this.workingDirectory, packageJsonLocation))

    if (!isExistPackageJson) {
      const packageJson: Buffer = await readFile(join(this.templateDirectory, 'package.json'))

      await writeFile(packageJsonLocation, packageJson, 'utf-8')
    }

    const packageJson = await readJson(packageJsonLocation)
    const commandFileLocation = join(this.workingDirectory, packageJson.main)

    const isExist = await pathExists(commandFileLocation)

    let commands: string
    if (!isExist) {
      const tsFile: Buffer = await readFile(join(this.templateDirectory, 'commands.ts'))

      await writeFile(commandFileLocation, tsFile, 'utf-8')

      commands = tsFile.toString()
    } else {
      const tsFile: Buffer = await readFile(commandFileLocation)

      commands = tsFile.toString()
    }

    const tsConfig = await readJson(join(this.templateDirectory, 'tsconfig.json'))

    tsConfig['compilerOptions'].typeRoots = [
      `${join(__dirname, '..', '..', 'node_modules', '@types')}`
    ]

    const id = short.generate()
    const temp = join(tmpdir(), `mterm-${id}`)

    await mkdirs(temp)

    const tsConfigFile = join(temp, 'tsconfig.json')
    const packageJsonTemp = join(temp, 'package.json')
    const scriptFile = join(temp, packageJson.main)

    await writeFile(scriptFile, commands, 'utf-8')
    await writeJson(tsConfigFile, tsConfig, 'utf-8')
    await writeJson(packageJsonTemp, packageJson, 'utf-8')

    await compile(scriptFile, temp)

    const jsFile: Buffer = await readFile(join(temp, 'commands.js'))

    runInNewContext(`${jsFile}`, this)

    console.log(this.lib)
  }
}
