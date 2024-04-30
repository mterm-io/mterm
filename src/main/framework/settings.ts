import { pathExists, readJSON, writeFile } from 'fs-extra'
import { clone, get as getFromPath, merge, set as setFromPath } from 'lodash'

export type SettingOverride<T> = ((priorValue: T) => T) | T
function isSettingOverrideFunction<T>(value: SettingOverride<T>): boolean {
  return typeof value === 'function'
}

export class Settings {
  private properties: object = {}
  private overrides: object = {}
  constructor(
    public location: string,
    private defaultSettings: object
  ) {}

  set<T>(path: string, value: T): void {
    setFromPath(this.properties, path, value)
  }

  async save(): Promise<void> {
    const prettyJSON = JSON.stringify(this.properties, null, 2)

    await writeFile(this.location, prettyJSON, 'utf-8')
  }
  value<T>(path: string): T {
    const props = merge({}, this.properties, this.overrides)
    return getFromPath(props, path)
  }
  override<T>(path: string, value: SettingOverride<T>): void {
    if (isSettingOverrideFunction(value)) {
      const priorValue = this.value<T>(path)
      const invokableFunction = value as (priorValue: T) => T

      const override = invokableFunction(priorValue)

      setFromPath(this.overrides, path, override)
    } else {
      setFromPath(this.overrides, path, value)
    }
  }
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
    const value = this.value<T>(key)

    if (value === undefined) {
      return orElse
    }

    return value
  }
}
