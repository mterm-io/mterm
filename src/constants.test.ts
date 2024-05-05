import { Profile } from './main/framework/runtime'
import {
  DEFAULT_WORKSPACE,
  DEFAULT_PROFILE,
  DEFAULT_PROFILES,
  DEFAULT_FOLDER,
  DEFAULT_HISTORY_ENABLED,
  DEFAULT_HISTORY_MAX_ITEMS,
  DEFAULT_HISTORY_SAVE_RESULT,
  DEFAULT_SETTING_RUNNER_SHORTCUT,
  DEFAULT_SETTING_COMMANDER_MODE_TOGGLE_SHORTCUT,
  DEFAULT_SETTING_IS_COMMANDER_MODE,
  DEFAULT_SETTING_COMMANDER_MODE_BOUNDS,
  DEFAULT_SETTING_RUNNER_BOUNDS,
  DEFAULT_SETTINGS
} from './constants'

describe('constants', () => {
  it('should have the correct DEFAULT_WORKSPACE', () => {
    expect(DEFAULT_WORKSPACE).toBe('~/mterm')
  })

  it('should have the correct DEFAULT_PROFILE based on the platform', () => {
    expect(DEFAULT_PROFILE).toBe(process.platform === 'win32' ? 'powershell' : 'sh')
  })

  it('should have the correct DEFAULT_PROFILES based on the platform', () => {
    const expectedProfiles: Record<string, Profile> =
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
    expect(DEFAULT_PROFILES).toEqual(expectedProfiles)
  })

  it('should have the correct DEFAULT_FOLDER', () => {
    expect(DEFAULT_FOLDER).toBe('$CWD')
  })

  it('should have the correct DEFAULT_HISTORY_ENABLED', () => {
    expect(DEFAULT_HISTORY_ENABLED).toBe(true)
  })

  it('should have the correct DEFAULT_HISTORY_MAX_ITEMS', () => {
    expect(DEFAULT_HISTORY_MAX_ITEMS).toBe(100)
  })

  it('should have the correct DEFAULT_HISTORY_SAVE_RESULT', () => {
    expect(DEFAULT_HISTORY_SAVE_RESULT).toBe(true)
  })

  it('should have the correct DEFAULT_SETTING_RUNNER_SHORTCUT', () => {
    expect(DEFAULT_SETTING_RUNNER_SHORTCUT).toBe('`+CommandOrControl')
  })

  it('should have the correct DEFAULT_SETTING_COMMANDER_MODE_TOGGLE_SHORTCUT', () => {
    expect(DEFAULT_SETTING_COMMANDER_MODE_TOGGLE_SHORTCUT).toBe('`+Shift+CommandOrControl')
  })

  it('should have the correct DEFAULT_SETTING_IS_COMMANDER_MODE', () => {
    expect(DEFAULT_SETTING_IS_COMMANDER_MODE).toBe(true)
  })

  it('should have the correct DEFAULT_SETTING_COMMANDER_MODE_BOUNDS', () => {
    expect(DEFAULT_SETTING_COMMANDER_MODE_BOUNDS).toEqual({
      screen: 0,
      x: 0,
      y: 'SCREEN:-.5',
      w: 'SCREEN',
      h: 500
    })
  })

  it('should have the correct DEFAULT_SETTING_RUNNER_BOUNDS', () => {
    expect(DEFAULT_SETTING_RUNNER_BOUNDS).toEqual({
      screen: 'PRIMARY',
      x: 'SCREEN:-.5',
      y: 'SCREEN:-.5',
      w: 720,
      h: 500
    })
  })

  it('should have the correct DEFAULT_SETTINGS', () => {
    expect(DEFAULT_SETTINGS).toEqual({
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
    })
  })
})
