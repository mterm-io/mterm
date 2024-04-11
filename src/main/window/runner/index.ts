import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { BrowserWindow, shell } from 'electron'
import icon from '../../../../resources/icon.png?asset'

export default async (): Promise<void> => {
  const mainWindow = new BrowserWindow({
    width: 1800,
    height: 400,
    transparent: true,
    frame: false,
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
    return mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    return mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}
