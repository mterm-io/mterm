import { BootstrapContext } from './index'
import { globalShortcut } from 'electron'
import {
  DEFAULT_SETTING_COMMANDER_MODE_TOGGLE_SHORTCUT,
  DEFAULT_SETTING_RUNNER_SHORTCUT
} from '../../constants'
import { RunnerWindow } from '../window/windows/runner'

export function createShortcut(context: BootstrapContext): void {
  const runnerHotkey = context.workspace.settings.get<string>(
    'runner.shortcut',
    DEFAULT_SETTING_RUNNER_SHORTCUT
  )
  const commanderModeHotkey = context.workspace.settings.get<string>(
    'runner.commanderModeShortcut',
    DEFAULT_SETTING_COMMANDER_MODE_TOGGLE_SHORTCUT
  )
  globalShortcut.register(runnerHotkey, () => {
    context.workspace.toggle(RunnerWindow)
  })
  globalShortcut.register(commanderModeHotkey, async () => {
    context.workspace.settings.override<boolean>(
      'runner.commanderMode',
      (isCommanderMode) => !isCommanderMode
    )

    await context.workspace.applySettings()
  })
}
