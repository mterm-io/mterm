import { Workspace } from './workspace'
import { ProfileMap } from './runtime'
import { DEFAULT_PROFILE, DEFAULT_PROFILES } from '../../constants'
import { pathExists, readFile, writeFile } from 'fs-extra'
import { log } from '../logger'

export class Theme {
  public themes: Map<string, string> = new Map()
  constructor(
    public workspace: Workspace,
    public defaultThemeLocation: string
  ) {}

  async load(): Promise<void> {
    this.themes.clear()
    //get profiles
    const profiles = this.workspace.settings.get<ProfileMap>('profiles', DEFAULT_PROFILES)
    const cache = {}

    const getDefaultTheme = async (): Promise<string> => {
      if (cache[this.defaultThemeLocation]) {
        return cache[this.defaultThemeLocation]
      }

      const cssBuffer = await readFile(this.defaultThemeLocation)
      const css = cssBuffer.toString()

      cache[this.defaultThemeLocation] = css

      return css
    }

    for (const profileKey in profiles) {
      const profile = profiles[profileKey]
      const cssFileLocation = this.workspace.resolve(profile.theme)

      let css = cache[cssFileLocation]
      if (!css) {
        const isExist = await pathExists(cssFileLocation)
        if (!isExist) {
          log(
            `profile = ${profileKey} is mapped to css file @ ${profile.theme}. could not find @ ${cssFileLocation} - creating default`
          )
          css = await getDefaultTheme()

          await writeFile(cssFileLocation, css, 'utf-8')
        } else {
          const cssFileBuffer = await readFile(cssFileLocation)
          css = cssFileBuffer.toString()
        }

        cache[cssFileLocation] = css
      }

      this.themes.set(profileKey, css)
    }
  }

  get(profileKey: string): string {
    if (profileKey === 'default') {
      profileKey = this.workspace.settings.get<string>('defaultProfile', DEFAULT_PROFILE)
    }
    return this.themes.get(profileKey) || ''
  }
}
