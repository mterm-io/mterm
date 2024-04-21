export const DEFAULT_WORKSPACE = '~/mterm'

export const DEFAULT_PLATFORM =
  process.platform === 'win32' ? `pwsh -noprofile -command $ARGS` : 'sh $ARGS'
export const DEFAULT_FOLDER = '$CWD'
export const DEFAULT_SETTING_RUNNER_SHORTCUT = '`+CommandOrControl'
export const DEFAULT_SETTING_COMMANDER_MODE_TOGGLE_SHORTCUT = '`+Shift+CommandOrControl'
export const DEFAULT_SETTING_IS_COMMANDER_MODE = true
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
  w: 720,
  h: 500
}
export const DEFAULT_SETTINGS = {
  platform: DEFAULT_PLATFORM,
  runner: {
    shortcut: DEFAULT_SETTING_RUNNER_SHORTCUT,
    bounds: DEFAULT_SETTING_RUNNER_BOUNDS,
    commanderModeShortcut: DEFAULT_SETTING_COMMANDER_MODE_TOGGLE_SHORTCUT,
    commanderMode: DEFAULT_SETTING_IS_COMMANDER_MODE,
    commanderModeBounds: DEFAULT_SETTING_COMMANDER_MODE_BOUNDS
  }
}
