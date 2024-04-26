import { MTermWindow } from '../window/mterm-window'
import { App, BrowserWindow } from 'electron'
import { Workspace } from '../framework/workspace'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createWindows } from './create-windows'
import { ErrorModal } from '../window/windows/error-modal'
import { createTray } from './create-tray'
import { createShortcut } from './create-shortcut'
import { attach } from '../framework/runtime-events'

export interface BootstrapContext {
  app: App
  workspace: Workspace
  windows: MTermWindow[]
  icon: string
  errorModal: ErrorModal
}
export async function boostrap(context: BootstrapContext): Promise<void> {
  const { app, workspace } = context

  await app.whenReady()

  electronApp.setAppUserModelId('com.electron')

  app.on('before-quit', function () {
    workspace.isAppQuiting = true
  })
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  attach(context)

  try {
    await workspace.load()

    await createWindows(context)

    await createTray(context)

    createShortcut(context)

    app.on('activate', async function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) await createWindows(context)
    })

    await workspace.commands.load()
  } catch (e) {
    console.error(e)

    await context.errorModal.showError(e)
    return
  }
}
