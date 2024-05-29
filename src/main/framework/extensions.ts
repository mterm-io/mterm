import { Workspace } from './workspace'
import { join } from 'path'
import { pathExists, readJson } from 'fs-extra'
import { log } from '../logger'

export enum ExtensionHook {
  RUNNER_THEME_CSS = 'RUNNER_THEME_CSS',
  EXT_POST_INSTALL = 'EXT_POST_INSTALL',
  COMMANDS = 'COMMANDS'
}

export type ExtensionHookCallback<T> = (...args) => T
export type ExtensionHookResolution<T> = string | ExtensionHookCallback<T>

export interface ExtensionHookResolutionContainer<T> {
  packageName: string
  resolution: ExtensionHookResolution<T>
  hook: ExtensionHook
}

export interface ExtensionCommandContainer {
  packageName: string
  command: string
}
export class Extensions {
  public extensionHooks: Map<ExtensionHook, Array<ExtensionHookResolutionContainer<object>>> =
    new Map<ExtensionHook, Array<ExtensionHookResolutionContainer<object>>>()
  public extensionList: string[] = []
  public extensionCommands: ExtensionCommandContainer[] = []
  constructor(private workspace: Workspace) {}

  async run<T>(hook: ExtensionHook, ifNullThen: T, ...args): Promise<T | undefined> {
    const resolutions = this.extensionHooks.get(hook) || []

    let stringResult = ''
    let result: T | undefined = undefined
    for (const container of resolutions) {
      const resolution = container.resolution
      if (typeof resolution === 'string') {
        stringResult = stringResult || ''
        stringResult += resolution

        result = stringResult as unknown as T
      } else {
        const maybeResult = resolution(...args) as T

        if (typeof maybeResult === 'string') {
          stringResult = stringResult || ''
          stringResult += resolution

          result = stringResult as unknown as T
        }
      }
    }

    return result || ifNullThen
  }

  async execute(hook: ExtensionHook, ...args): Promise<void> {
    await this.executeFor(hook, '*', ...args)
  }

  async executeFor(hook: ExtensionHook, extName: string, ...args): Promise<void> {
    const resolutions = (this.extensionHooks.get(hook) || []).filter(
      (r) => extName === '*' || r['packageName'] === extName
    )

    for (const container of resolutions) {
      const resolution = container.resolution
      if (typeof resolution === 'function') {
        await resolution(...args)
      }
    }
  }

  async load(): Promise<void> {
    this.extensionCommands.forEach((cmd) => {
      // clean up prior command registrations
      this.workspace.commands.delete(cmd.command)
    })

    this.extensionList = []
    this.extensionCommands = []
    this.extensionHooks.clear()

    const start = Date.now()
    const packageJson = join(this.workspace.folder, 'package.json')
    const isPackageJsonExists = await pathExists(packageJson)
    if (!isPackageJsonExists) {
      log('No package.json found in workspace')
      return
    }
    const packageJsonData = await readJson(packageJson)
    const packages: string[] = []

    if (packageJsonData.dependencies) {
      packages.push(...Object.keys(packageJsonData.dependencies))
    }
    if (packageJsonData.devDependencies) {
      packages.push(...Object.keys(packageJsonData.devDependencies))
    }

    const workspace = this.workspace
    const ext = this.extensionHooks
    const list = this.extensionList
    const cmdList = this.extensionCommands
    async function scan(packageName: string): Promise<void> {
      log(`Scanning package: ${packageName}..`)

      const mtermExtPath = join(workspace.folder, 'node_modules', packageName, 'mterm.js')

      const isMtermExtensionExists = await pathExists(mtermExtPath)
      if (!isMtermExtensionExists) {
        return
      }

      log(`Loading package: ${packageName}`)
      const mtermExt = require(mtermExtPath)

      const hooks = Object.keys(ExtensionHook)

      log(`Mapping hooks for ${packageName} = ${hooks}`)

      list.push(packageName)

      for (const hook of hooks) {
        const hookKey = hook as ExtensionHook
        if (hookKey === ExtensionHook.COMMANDS) {
          const commands = mtermExt[hookKey]
          if (typeof commands === 'function') {
            const commandsResult = commands()

            Object.keys(commandsResult).forEach((command) => {
              const { description, exec } = commandsResult[command]

              log(`Registering command: ${command} for ${packageName} (${description})`)

              workspace.commands.add(command, exec)

              cmdList.push({
                packageName,
                command
              })
            })
          }
          continue
        }
        let resolutions: ExtensionHookResolutionContainer<object>[] = []
        if (ext.has(ExtensionHook[hookKey])) {
          resolutions = ext.get(
            ExtensionHook[hookKey]
          ) as ExtensionHookResolutionContainer<object>[]
        }

        const extHook = mtermExt[hookKey]

        resolutions.push({
          packageName,
          resolution: extHook,
          hook: hookKey
        })

        ext.set(hookKey, resolutions)
      }
    }

    const promiseList = packages.map(scan)

    await Promise.all(promiseList)

    log('Extensions loaded in ' + (Date.now() - start) + 'ms')
  }
}
