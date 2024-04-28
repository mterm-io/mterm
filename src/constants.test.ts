import {
  DEFAULT_WORKSPACE,
  DEFAULT_PROFILE,
  DEFAULT_PROFILES,
  DEFAULT_FOLDER,
  DEFAULT_SETTING_RUNNER_SHORTCUT,
  DEFAULT_SETTING_COMMANDER_MODE_TOGGLE_SHORTCUT,
  DEFAULT_SETTING_IS_COMMANDER_MODE,
  DEFAULT_SETTING_COMMANDER_MODE_BOUNDS,
  DEFAULT_SETTING_RUNNER_BOUNDS,
  DEFAULT_SETTINGS
} from './constants'

describe('constants', () => {
  it('should have the correct default workspace', () => {
    expect(DEFAULT_WORKSPACE).toBe('~/mterm')
  })

  it('should have the correct default profile based on platform', () => {
    const expectedDefaultProfile = process.platform === 'win32' ? 'powershell' : 'sh'
    expect(DEFAULT_PROFILE).toBe(expectedDefaultProfile)
  })

  it('should have the correct default profiles based on platform', () => {
    const expectedDefaultProfiles =
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
    expect(DEFAULT_PROFILES).toEqual(expectedDefaultProfiles)
  })

  it('should have the correct default folder', () => {
    expect(DEFAULT_FOLDER).toBe('$CWD')
  })

  it('should have the correct default setting runner shortcut', () => {
    expect(DEFAULT_SETTING_RUNNER_SHORTCUT).toBe('`+CommandOrControl')
  })

  it('should have the correct default setting commander mode toggle shortcut', () => {
    expect(DEFAULT_SETTING_COMMANDER_MODE_TOGGLE_SHORTCUT).toBe('`+Shift+CommandOrControl')
  })

  it('should have the correct default setting for commander mode', () => {
    expect(DEFAULT_SETTING_IS_COMMANDER_MODE).toBe(true)
  })

  it('should have the correct default setting for commander mode bounds', () => {
    expect(DEFAULT_SETTING_COMMANDER_MODE_BOUNDS).toEqual({
      screen: 0,
      x: 0,
      y: 'SCREEN:-.5',
      w: 'SCREEN',
      h: 500
    })
  })

  it('should have the correct default setting for runner bounds', () => {
    expect(DEFAULT_SETTING_RUNNER_BOUNDS).toEqual({
      screen: 'PRIMARY',
      x: 'SCREEN:-.5',
      y: 'SCREEN:-.5',
      w: 720,
      h: 500
    })
  })

  it('should have the correct default settings', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      defaultProfile: DEFAULT_PROFILE,
      profiles: DEFAULT_PROFILES,
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
