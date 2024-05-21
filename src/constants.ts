import { Profile } from './main/framework/runtime'

export const DEFAULT_WORKSPACE = '~/mterm'

export const DEFAULT_PROFILE = process.platform === 'win32' ? 'powershell' : 'sh'
export const DEFAULT_PROFILES: Record<string, Profile> =
  process.platform === 'win32'
    ? {
        powershell: {
          platform: `${process.env.SYSTEMROOT}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe -noprofile -command $ARGS`,
          theme: 'theme.css',
          icon: 'default'
        },
        wsl: {
          platform: `bash -c $ARGS`,
          theme: 'theme.css',
          icon: 'default'
        }
      }
    : {
        sh: {
          platform: 'sh -c $ARGS',
          theme: 'theme.css',
          icon: 'default'
        }
      }
export const DEFAULT_FOLDER = '$CWD'
export const DEFAULT_HISTORY_ENABLED = true

export const DEFAULT_HISTORY_MAX_ITEMS = 1000
export const DEFAULT_HISTORY_SAVE_RESULT = true
export const DEFAULT_SETTING_RUNNER_SHORTCUT = '`+CommandOrControl'
export const DEFAULT_SETTING_COMMANDER_MODE_TOGGLE_SHORTCUT = '`+Shift+CommandOrControl'
export const DEFAULT_SETTING_IS_COMMANDER_MODE = false
export const DEFAULT_SETTING_COMMANDER_MODE_BOUNDS = {
  screen: 0,
  x: 0,
  y: 'SCREEN:-.5',
  w: 'SCREEN',
  h: 500
}

export const DEFAULT_SETTING_RUNNER_BOUNDS = {
  screen: 'PRIMARY',
  x: 'SCREEN:-.5',
  y: 'SCREEN:-.5',
  w: 820,
  h: 500
}

export const DEFAULT_SETTINGS = {
  defaultProfile: DEFAULT_PROFILE,
  profiles: DEFAULT_PROFILES,
  history: {
    enabled: DEFAULT_HISTORY_ENABLED,
    maxItems: DEFAULT_HISTORY_MAX_ITEMS,
    saveResult: DEFAULT_HISTORY_SAVE_RESULT
  },
  runner: {
    shortcut: DEFAULT_SETTING_RUNNER_SHORTCUT,
    bounds: DEFAULT_SETTING_RUNNER_BOUNDS,
    commanderModeShortcut: DEFAULT_SETTING_COMMANDER_MODE_TOGGLE_SHORTCUT,
    commanderMode: DEFAULT_SETTING_IS_COMMANDER_MODE,
    commanderModeBounds: DEFAULT_SETTING_COMMANDER_MODE_BOUNDS
  }
}
