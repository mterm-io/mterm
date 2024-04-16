import { MTermWindow } from '../mterm-window'
import { Settings } from '../../../framework/settings'
import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron'
import {
  DEFAULT_SETTING_COMMANDER_MODE_BOUNDS,
  DEFAULT_SETTING_IS_COMMANDER_MODE,
  DEFAULT_SETTING_RUNNER_BOUNDS
} from '../../../constants'
import { RunnerBounds } from '../../model'
import { getBoundaryValue, getDisplay } from '../../util'

export class RunnerWindow extends MTermWindow {
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

    console.log(isCommanderMode)

    const boundary = isCommanderMode ? commanderModeBounds : bounds
    const display = getDisplay(boundary)

    const x = getBoundaryValue(boundary.x, display.size.width, boundary.w)
    const y = getBoundaryValue(boundary.y, display.size.height, boundary.h)

    const w = getBoundaryValue(boundary.w, display.size.width, boundary.w)
    const h = getBoundaryValue(boundary.h, display.size.height, boundary.h)

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
