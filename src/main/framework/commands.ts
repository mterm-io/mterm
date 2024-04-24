import { mkdirs, pathExists, readFile, readJson, writeFile, writeJson } from 'fs-extra'
import { tmpdir } from 'node:os'
import { join } from 'path'
import short from 'short-uuid'
import { runInNewContext } from 'node:vm'
import * as tryRequire from 'try-require'
import { compile } from '../vendor/webpack'

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

    const packageJson = await readJson(join(this.workingDirectory, 'package.json'))
    const commandFileLocation = join(this.workingDirectory, packageJson.main)
    const commands: Buffer = await readFile(commandFileLocation)

    const tsConfig = await readJson(join(this.templateDirectory, 'tsconfig.json'))

    tsConfig['compilerOptions'].typeRoots = [join(__dirname, '..', '..', 'node_modules', '@types')]

    const id = short.generate()
    const temp = join(tmpdir(), `mterm-${id}`)
    await mkdirs(temp)

    const scriptFile = join(temp, packageJson.main)
    await writeFile(scriptFile, commands, 'utf-8')
    await writeJson(join(temp, 'tsconfig.json'), tsConfig, 'utf-8')
    await writeJson(join(temp, 'package.json'), packageJson, 'utf-8')

    await compile(scriptFile, temp)

    const jsFile: Buffer = await readFile(join(temp, 'commands.js'))
    runInNewContext(`${jsFile}`, this)
  }
}
