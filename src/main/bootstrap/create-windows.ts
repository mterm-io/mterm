import { BootstrapContext } from './index'
import { DEFAULT_SETTING_IS_COMMANDER_MODE } from '../../constants'
import { MTermWindow } from '../window/mterm-window'
import { Workspace } from '../../framework/workspace'

export async function createWindows(context: BootstrapContext): Promise<void> {
  for (const window of context.windows) {
    if (context.workspace.hasWindowReady(window)) {
      return
    }

    context.workspace.addWindowToContext(window)

    await window.preInitChanges(context.workspace.settings, window.options)

    await window.init()

    await window.postInitChanges(context.workspace.settings, window.browserWindow)

    attachBrowserWindowListeners(window, context.workspace)
  }
}

export function attachBrowserWindowListeners(window: MTermWindow, workspace: Workspace): void {
  window.browserWindow?.on('close', function (evt) {
    if (!workspace.isAppQuiting) {
      evt.preventDefault()
    }

    window.hide()
  })
  window.browserWindow?.on('resize', function () {
    const size = window.browserWindow?.getSize()
    if (
      !size ||
      workspace.settings.get<boolean>('runner.commanderMode', DEFAULT_SETTING_IS_COMMANDER_MODE)
    ) {
      return
    }

    workspace.settings.override<number>('runner.bounds.w', size[0])
    workspace.settings.override<number>('runner.bounds.h', size[1])
  })
  window.browserWindow?.on('move', function () {
    const position = window.browserWindow?.getPosition()
    if (
      !position ||
      workspace.settings.get<boolean>('runner.commanderMode', DEFAULT_SETTING_IS_COMMANDER_MODE)
    ) {
      return
    }

    workspace.settings.override<number>('runner.bounds.x', position[0])
    workspace.settings.override<number>('runner.bounds.y', position[1])
  })
}
