import { mkdirs, pathExists, readFile, readJson, writeFile, writeJson, remove } from 'fs-extra'
import { tmpdir } from 'node:os'
import { join } from 'path'
import short from 'short-uuid'
import { runInNewContext } from 'node:vm'
import * as tryRequire from 'try-require'
import { compile } from '../vendor/webpack'
import { Settings } from './settings'
import { ExecuteContext } from './execute-context'
import { CommandUtils } from './command-utils'
import { shell } from 'electron'
import { snakeCase } from 'lodash'
export class Commands {
  public lib: object = {}
  public commandFileLocation: string = ''
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
    return !!this.lib[key] || !!this.lib[Commands.toCommandName(key)]
  }

  static toCommandName(command: string = ''): string {
    return snakeCase(command).toLowerCase().trim()
  }

  async run(context: ExecuteContext, key: string, ...args: string[]): Promise<unknown> {
    let state = this.state[key]
    const cmd = this.lib[key] || this.lib[Commands.toCommandName(key)]

    if (!state) {
      state = {}

      this.state[key] = state
    }

    const scoped = {
      ...state,
      context,
      util: new CommandUtils(),
      shell,
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

  async load(settings: Settings): Promise<void> {
    const filesToCreate = [
      { templateFile: 'package.json', outputFile: 'package.json' },
      { templateFile: 'commands.ts', outputFile: 'commands.ts' },
      { templateFile: 'node_types.ts', outputFile: 'types.d.ts' }
    ]

    const ignoreTemplates = settings.get<string[]>('ignoreTemplate', [])

    for (const { templateFile, outputFile } of filesToCreate) {
      const outputFilePath = join(this.workingDirectory, outputFile)
      const isExist = await pathExists(outputFilePath)

      if (!isExist && !ignoreTemplates.includes(outputFile)) {
        const templateFilePath = join(this.templateDirectory, templateFile)
        const templateContent: Buffer = await readFile(templateFilePath)
        await writeFile(outputFilePath, templateContent, 'utf-8')
      }
    }

    const tsConfigTarget = join(this.workingDirectory, 'tsconfig.json')
    const isTSConfigExists = await pathExists(tsConfigTarget)
    if (!isTSConfigExists && !ignoreTemplates.includes('tsconfig.json')) {
      const tsConfig = await readJson(join(this.templateDirectory, 'tsconfig.json'))

      tsConfig['compilerOptions'].types = tsConfig['compilerOptions'].types || []
      tsConfig['compilerOptions'].types.push(join(this.workingDirectory, 'types.d.ts'))

      await writeJson(tsConfigTarget, tsConfig)
    }

    const packageJson = await readJson(join(this.workingDirectory, 'package.json'))

    this.commandFileLocation = join(this.workingDirectory, packageJson.main)

    const id = short.generate()
    const temp = join(tmpdir(), `mterm-${id}`)
    await mkdirs(temp)

    await compile(this.commandFileLocation, temp, join(this.workingDirectory, 'node_modules'))

    const jsFile: Buffer = await readFile(join(temp, 'commands.js'))

    this.lib = {}

    runInNewContext(`${jsFile}`, this)

    const libTranslated = {}

    Object.keys(this.lib).forEach((key) => {
      libTranslated[Commands.toCommandName(key)] = this.lib[key]
    })

    this.lib = libTranslated
  }

  getCommandFileLocation(cmd: string): string {
    return join(this.workingDirectory, 'commands', `${Commands.toCommandName(cmd)}.ts`)
  }

  async addCommand(cmd: string, cmdScript: string = ''): Promise<void> {
    cmd = Commands.toCommandName(cmd)

    const commandFolder = join(this.workingDirectory, 'commands')
    const commandFolderExists = await pathExists(commandFolder)
    if (!commandFolderExists) {
      await mkdirs(commandFolder)
    }

    const scriptFileBuffer = await readFile(this.commandFileLocation)
    const scriptFile = scriptFileBuffer.toString()
    const exportText = `export { ${cmd} } from './commands/${cmd}'`
    const script = `${scriptFile}\n${exportText}`

    const commandFile = join(commandFolder, `${cmd}.ts`)
    const commandFileContents = `export function ${cmd}() {\n\t// your code here\n\t${cmdScript}\n}\n`

    await writeFile(commandFile, commandFileContents)
    await writeFile(this.commandFileLocation, script)
  }

  async removeCommand(cmd: string): Promise<void> {
    cmd = Commands.toCommandName(cmd)

    const commandFolder = join(this.workingDirectory, 'commands')
    const commandFolderExists = await pathExists(commandFolder)
    if (commandFolderExists) {
      const commandFile = join(commandFolder, `${cmd}.ts`)
      const commandFileExists = await pathExists(commandFile)
      if (commandFileExists) {
        await remove(cmd)
      }
    }

    const scriptFileBuffer = await readFile(this.commandFileLocation)
    const scriptFile = scriptFileBuffer.toString()
    const script = scriptFile.replaceAll(`\nexport { ${cmd} } from './commands/${cmd}'`, '')

    await writeFile(this.commandFileLocation, script)
  }
}
