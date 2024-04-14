import { app, BrowserWindow, ipcMain, Menu, shell, Tray } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'

import icon from '../../resources/icon.png?asset'

import { PlatformWindow } from './window/windows/platform'
import { RunnerWindow } from './window/windows/runner'

const runner = new RunnerWindow(icon, {
  width: 1800,
  height: 600,
  transparent: true,
  frame: false
})

const platform = new PlatformWindow(icon, {
  width: 600,
  height: 600
})

async function createWindow(): Promise<void> {
  await runner.init('', true)
  await platform.init('store')
}

function createTray(): void {
  const tray = new Tray(icon)

  if (process.platform === 'win32') {
    tray.on('right-click', () => tray.popUpContextMenu())
  }
  const menu = Menu.buildFromTemplate([
    {
      label: 'Open Terminal',
      click(): void {
        runner.show()
        runner.open('')
      }
    },
    {
      label: 'Hide Terminal',
      click(): void {
        runner.hide()
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click(): void {
        platform.hide()
        runner.show()
        runner.open('settings/general')
      }
    },
    {
      label: 'Secrets',
      click(): void {
        runner.hide()
        platform.open('store')
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
        app.quit()
      }
    }
  ])

  tray.setToolTip('MTERM')
  tray.setContextMenu(menu)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()
  createTray()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
