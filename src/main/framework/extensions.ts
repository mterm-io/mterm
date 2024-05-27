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
  public extensionHooks: Map<ExtensionHook, ExtensionHookResolution> = new Map<
    ExtensionHook,
    ExtensionHookResolution
  >()
  constructor(private workspace: Workspace) {}

  async load(): Promise<void> {
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
    async function scan(packageName: string): Promise<void> {
      log(`Scanning package: ${packageName}`)

      const mtermExtPath = join(folder, 'node_modules', packageName, 'mterm.js')

      const isMtermExtensionExists = await pathExists(mtermExtPath)
      if (!isMtermExtensionExists) {
        log(`No mterm.js found in ${packageName}, skipping`)
        return
      }

      log(`Loading package: ${packageName}`)
    }

    const promiseList = packages.map(scan)

    await Promise.all(promiseList)
  }
}
