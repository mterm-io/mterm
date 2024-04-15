import { BootstrapContext } from './index'
import { Menu, shell, Tray } from 'electron'
import { RunnerWindow } from '../window/windows/runner'
import { PlatformWindow } from '../window/windows/platform'

export async function createTray(context: BootstrapContext): Promise<void> {
  const tray = new Tray(context.icon)

  if (process.platform === 'win32') {
    tray.on('right-click', () => tray.popUpContextMenu())
  }

  const menu = Menu.buildFromTemplate([
    {
      label: 'Open Terminal',
      click(): void {
        context.workspace.show(RunnerWindow)
      }
    },
    {
      label: 'Hide Terminal',
      click(): void {
        context.workspace.hide(RunnerWindow)
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click(): void {
        context.workspace.showAndHideOthers(RunnerWindow, 'settings/general')
      }
    },
    {
      label: 'Secrets',
      click(): void {
        context.workspace.showAndHideOthers(PlatformWindow, 'store')
      }
    },
    {
      label: 'Workspace',
      async click(): Promise<void> {
        await shell.openPath(context.workspace.folder)
      }
    },
    { type: 'separator' },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click: async (): Promise<void> => {
            await shell.openExternal('https://mterm.io?open=help.learn')
          }
        },
        {
          label: 'Documentation',
          click: async (): Promise<void> => {
            await shell.openExternal('https://mterm.io?open=help.docs')
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click(): void {
        context.app.quit()
      }
    }
  ])

  tray.setToolTip('MTERM')
  tray.setContextMenu(menu)
}
