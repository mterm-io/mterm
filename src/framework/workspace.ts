import { join, resolve } from 'path'
import { Settings } from './settings'
import { mkdirs, pathExists } from 'fs-extra'
import { homedir } from 'node:os'

export class Workspace {
  public settings: Settings
  constructor(
    public folder: string,
    defaultSettings: object
  ) {
    /**
     * Cleanup and replace '~' with homedir location
     */
    this.folder = this.folder.replace('~', homedir())
    this.folder = resolve(this.folder)

    this.settings = new Settings(join(folder, 'settings.json'), defaultSettings)
  }

  async load(): Promise<Workspace> {
    const isExist = await pathExists(this.folder)
    if (!isExist) {
      await mkdirs(this.folder)
    }

    await this.settings.load()

    return this
  }
}
