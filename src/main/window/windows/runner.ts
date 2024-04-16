import { MTermWindow } from '../mterm-window'
import { Settings } from '../../../framework/settings'
import { BrowserWindow, BrowserWindowConstructorOptions, screen, Display } from 'electron'
import {
  DEFAULT_SETTING_COMMANDER_MODE_BOUNDS,
  DEFAULT_SETTING_IS_COMMANDER_MODE,
  DEFAULT_SETTING_RUNNER_BOUNDS
} from '../../../constants'
import { ComputedBounds, RunnerBounds } from '../../model'
import { getBounds } from '../../util'

export class RunnerWindow extends MTermWindow {
  static getDisplay(bounds: RunnerBounds): Display {
    const boundsScreen = bounds.screen
    if (typeof boundsScreen === 'string') {
      return screen.getPrimaryDisplay()
    }
    const displays = screen.getAllDisplays()
    if (boundsScreen > 0 && boundsScreen <= displays.length - 1) {
      return displays[boundsScreen]
    }

    return screen.getPrimaryDisplay()
  }

  preInitChanges(settings: Settings, options: BrowserWindowConstructorOptions): void {
    const bounds = settings.get<RunnerBounds>('runner.bounds', DEFAULT_SETTING_RUNNER_BOUNDS)

    const isCommanderMode = settings.get<boolean>(
      'runner.commanderMode',
      DEFAULT_SETTING_IS_COMMANDER_MODE
    )

    const commanderModeBounds = settings.get<RunnerBounds>(
      'runner.commanderModeBounds',
      DEFAULT_SETTING_COMMANDER_MODE_BOUNDS
    )

    const { x, y, w, h } = getBounds(bounds, isCommanderMode, commanderModeBounds)

    options.x = x
    options.y = y
    options.width = w
    options.height = h

    options.skipTaskbar = isCommanderMode
    options.frame = !isCommanderMode
    options.movable = !isCommanderMode
    options.alwaysOnTop = true
  }

  postInitChanges(settings: Settings, window: BrowserWindow): void {
    const isCommanderMode = settings.get<boolean>('runner.commanderMode', true)

    window.setVisibleOnAllWorkspaces(isCommanderMode)
    window.focus()
  }
}
