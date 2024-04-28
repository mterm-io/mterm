import { mkdirs, pathExists, readFile, readJson, writeFile, writeJson } from 'fs-extra'
import { tmpdir } from 'node:os'
import { join } from 'path'
import short from 'short-uuid'
import { runInNewContext } from 'node:vm'
import * as tryRequire from 'try-require'
import { compile } from '../vendor/webpack'
import { ExecuteContext } from './runtime'

export class Commands {
  public lib: object = {}
  public state: Map<string, object> = new Map<string, object>()

  constructor(
    private workingDirectory: string,
    private templateDirectory: string
  ) {}

  require(path: string): unknown {
    return tryRequire.default(path)
  }

  setTimeout = global.setTimeout
  console = global.console
  fetch = global.fetch

  has(key: string): boolean {
    return !!this.lib[key]
  }

  async run(context: ExecuteContext, key: string, ...args: string[]): Promise<unknown> {
    let state = this.state[key]
    const cmd = this.lib[key]

    if (!state) {
      state = {}

      this.state[key] = state
    }

    const scoped = {
      ...state,
      context,
      vault: {
        async unlock(password: string): Promise<object> {
          return context.workspace.store.open(password)
        },
        get(key: string, orElse?: string): string {
          if (!context.workspace.store.unlocked) {
            throw 'Vault is locked, unlock before using secrets. Open with :vault'
          }
          return context.workspace.store.get(key, orElse)
        }
      }
    }

    const exec = cmd.call(scoped, ...args)

    this.state[key] = {
      ...scoped,
      context: undefined,
      vault: undefined
    }

    return exec
  }

  async load(): Promise<void> {
    const filesToCreate = [
      { templateFile: 'package.json', outputFile: 'package.json' },
      { templateFile: 'commands.ts', outputFile: 'commands.ts' },
      { templateFile: 'tsconfig.json', outputFile: 'tsconfig.json' }
    ]

    for (const { templateFile, outputFile } of filesToCreate) {
      const outputFilePath = join(this.workingDirectory, outputFile)
      const isExist = await pathExists(outputFilePath)

      if (!isExist) {
        const templateFilePath = join(this.templateDirectory, templateFile)
        const templateContent: Buffer = await readFile(templateFilePath)
        await writeFile(outputFilePath, templateContent, 'utf-8')
      }
    }

    const nodeTypesFileLocation = join(this.templateDirectory, 'node_types.ts')
    const types: Buffer = await readFile(nodeTypesFileLocation)

    const packageJson = await readJson(join(this.workingDirectory, 'package.json'))

    const commandFileLocation = join(this.workingDirectory, packageJson.main)
    const commands: Buffer = await readFile(commandFileLocation)

    const tsConfig = await readJson(join(this.workingDirectory, 'tsconfig.json'))

    const id = short.generate()
    const temp = join(tmpdir(), `mterm-${id}`)
    await mkdirs(temp)

    tsConfig['compilerOptions'].types = tsConfig['compilerOptions'].types || []
    tsConfig['compilerOptions'].types.push(join(temp, 'node.d.ts'))

    const scriptFile = join(temp, packageJson.main)
    await writeFile(scriptFile, commands, 'utf-8')
    await writeJson(join(temp, 'tsconfig.json'), tsConfig, 'utf-8')
    await writeJson(join(temp, 'package.json'), packageJson, 'utf-8')

    await writeFile(join(temp, 'node.d.ts'), types, 'utf-8')

    await compile(scriptFile, temp, join(this.workingDirectory, 'node_modules'))

    const jsFile: Buffer = await readFile(join(temp, 'commands.js'))

    runInNewContext(`${jsFile}`, this)
  }
}
