import { pathExists, readJSON, writeFile } from 'fs-extra'
import { clone, get as getFromPath } from 'lodash'

export class Settings {
  private properties: object = {}
  constructor(
    private location: string,
    private defaultSettings: object
  ) {}
  async load(): Promise<void> {
    const isExist = await pathExists(this.location)
    if (!isExist) {
      const prettyJSON = JSON.stringify(this.defaultSettings, null, 2)

      await writeFile(this.location, prettyJSON, 'utf-8')

      this.properties = clone(this.defaultSettings)
    } else {
      this.properties = await readJSON(this.location)
    }
  }

  get<T>(key: string, orElse: T): T {
    const value = getFromPath(this.properties, key)

    if (value === undefined) {
      return orElse
    }

    return value
  }
}
