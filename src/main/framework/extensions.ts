import { Workspace } from './workspace'
import { join } from 'path'
import { pathExists, readJson } from 'fs-extra'
import { log } from '../logger'

export enum ExtensionHook {
  RUNNER_THEME_CSS = 'RUNNER_THEME_CSS'
}

export type ExtensionHookCallback<T> = (...args) => T
export type ExtensionHookResolution<T> = string | ExtensionHookCallback<T>
export class Extensions {
  public extensionHooks: Map<ExtensionHook, Array<ExtensionHookResolution<object>>> = new Map<
    ExtensionHook,
    Array<ExtensionHookResolution<object>>
  >()
  public extensionList: string[] = []
  constructor(private workspace: Workspace) {}

  async run<T>(hook: ExtensionHook, ifNullThen: T, ...args): Promise<T | undefined> {
    const resolutions = this.extensionHooks.get(hook) || []

    let stringResult = ''
    let result: T | undefined = undefined
    for (const resolution of resolutions) {
      if (typeof resolution === 'string') {
        stringResult = stringResult || ''
        stringResult += resolution

        result = stringResult as unknown as T
      } else {
        result = resolution(...args) as T
      }
    }

    return result || ifNullThen
  }

  async load(): Promise<void> {
    this.extensionList = []
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

    const folder = this.workspace.folder
    const ext = this.extensionHooks
    const list = this.extensionList
    async function scan(packageName: string): Promise<void> {
      log(`Scanning package: ${packageName}..`)

      const mtermExtPath = join(folder, 'node_modules', packageName, 'mterm.js')

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
        let resolutions: ExtensionHookResolution<object>[] = []
        if (ext.has(ExtensionHook[hookKey])) {
          resolutions = ext.get(ExtensionHook[hookKey]) as ExtensionHookResolution<object>[]
        }

        resolutions.push(mtermExt[hookKey])

        ext.set(hookKey, resolutions)
      }
    }

    const promiseList = packages.map(scan)

    await Promise.all(promiseList)

    log('Extensions loaded in ' + (Date.now() - start) + 'ms')
  }
}
