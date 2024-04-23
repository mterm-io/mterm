import {
  DEFAULT_WORKSPACE,
  DEFAULT_PLATFORM,
  DEFAULT_FOLDER,
  DEFAULT_SETTING_RUNNER_SHORTCUT,
  DEFAULT_SETTING_COMMANDER_MODE_TOGGLE_SHORTCUT,
  DEFAULT_SETTING_IS_COMMANDER_MODE,
  DEFAULT_SETTING_COMMANDER_MODE_BOUNDS,
  DEFAULT_SETTING_RUNNER_BOUNDS,
  DEFAULT_SETTINGS
} from './constants'

describe('Default settings', () => {
  test('DEFAULT_WORKSPACE should be "~/mterm"', () => {
    expect(DEFAULT_WORKSPACE).toBe('~/mterm')
  })

  test('DEFAULT_PLATFORM should be platform-specific', () => {
    const expectedPlatform =
      process.platform === 'win32' ? 'pwsh -noprofile -command $ARGS' : 'sh $ARGS'
    expect(DEFAULT_PLATFORM).toBe(expectedPlatform)
  })

  test('DEFAULT_FOLDER should be "$CWD"', () => {
    expect(DEFAULT_FOLDER).toBe('$CWD')
  })

  test('DEFAULT_SETTING_RUNNER_SHORTCUT should be "`+CommandOrControl"', () => {
    expect(DEFAULT_SETTING_RUNNER_SHORTCUT).toBe('`+CommandOrControl')
  })

  test('DEFAULT_SETTING_COMMANDER_MODE_TOGGLE_SHORTCUT should be "`+Shift+CommandOrControl"', () => {
    expect(DEFAULT_SETTING_COMMANDER_MODE_TOGGLE_SHORTCUT).toBe('`+Shift+CommandOrControl')
  })

  test('DEFAULT_SETTING_IS_COMMANDER_MODE should be true', () => {
    expect(DEFAULT_SETTING_IS_COMMANDER_MODE).toBe(true)
  })

  test('DEFAULT_SETTING_COMMANDER_MODE_BOUNDS should have correct values', () => {
    expect(DEFAULT_SETTING_COMMANDER_MODE_BOUNDS).toEqual({
      screen: 0,
      x: 0,
      y: 'SCREEN:-.5',
      w: 'SCREEN',
      h: 500
    })
  })

  test('DEFAULT_SETTING_RUNNER_BOUNDS should have correct values', () => {
    expect(DEFAULT_SETTING_RUNNER_BOUNDS).toEqual({
      screen: 'PRIMARY',
      x: 'SCREEN:-.5',
      y: 'SCREEN:-.5',
      w: 720,
      h: 500
    })
  })

  test('DEFAULT_SETTINGS should have correct values', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      platform: DEFAULT_PLATFORM,
      runner: {
        shortcut: DEFAULT_SETTING_RUNNER_SHORTCUT,
        bounds: DEFAULT_SETTING_RUNNER_BOUNDS,
        commanderModeShortcut: DEFAULT_SETTING_COMMANDER_MODE_TOGGLE_SHORTCUT,
        commanderMode: DEFAULT_SETTING_IS_COMMANDER_MODE,
        commanderModeBounds: DEFAULT_SETTING_COMMANDER_MODE_BOUNDS
      }
    })
  })
})
