import { BootstrapContext } from './index'

export async function createWindows(context: BootstrapContext): Promise<void> {
  for (const window of context.windows) {
    if (context.workspace.hasWindowReady(window)) {
      return
    }

    context.workspace.addWindowToContext(window)

    await window.onLoad(context.workspace.settings, window.options)

    await window.init()

    window.browserWindow?.on('close', function (evt) {
      if (!context.workspace.isAppQuiting) {
        evt.preventDefault()
      }
    })
  }
}
