export const DEFAULT_WORKSPACE = '~/mterm'

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
  runner: {
    bounds: DEFAULT_SETTING_RUNNER_BOUNDS,
    commanderMode: DEFAULT_SETTING_IS_COMMANDER_MODE,
    commanderModeBounds: DEFAULT_SETTING_COMMANDER_MODE_BOUNDS
  }
}
