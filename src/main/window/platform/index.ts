import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../../../resources/icon.png?asset'
export default async (): Promise<void> => {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    transparent: false,
    frame: true,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    return mainWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/settings`)
  } else {
    return mainWindow.loadFile(`${join(__dirname, '../renderer/index.html')}/settings`)
  }
}
