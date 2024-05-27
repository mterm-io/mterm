import { Workspace } from './workspace'
import { join } from 'path'
import { pathExists, readJson } from 'fs-extra'
import { log } from '../logger'

export enum ExtensionHook {
  RUNNER_THEME_CSS = 'RUNNER_THEME_CSS'
}

export type ExtensionHookCallback = (workspace?: Workspace) => string
export type ExtensionHookResolution = string | ExtensionHookCallback
export class Extensions {
  public extensionHooks: Map<ExtensionHook, Array<ExtensionHookResolution>> = new Map<
    ExtensionHook,
    Array<ExtensionHookResolution>
  >()
  constructor(private workspace: Workspace) {}

  async run(hook: ExtensionHook): Promise<string> {
    const resolutions = this.extensionHooks.get(hook) || []

    let result = ''
    for (const resolution of resolutions) {
      if (typeof resolution === 'string') {
        result += resolution
      } else {
        result += resolution(this.workspace)
      }
    }

    return result
  }

  async load(): Promise<void> {
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

      for (const hook of hooks) {
        const hookKey = hook as ExtensionHook
        let resolutions: ExtensionHookResolution[] = []
        if (ext.has(ExtensionHook[hookKey])) {
          resolutions = ext.get(ExtensionHook[hookKey]) as ExtensionHookResolution[]
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
