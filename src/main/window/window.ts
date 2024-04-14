import { BrowserWindow, BrowserWindowConstructorOptions, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { Settings } from '../../framework/settings'

export abstract class MTermWindow {
  private window?: BrowserWindow
  public options: BrowserWindowConstructorOptions

  constructor(icon: string, options: Partial<BrowserWindowConstructorOptions> = {}) {
    this.options = {
      width: 1800,
      height: 400,
      transparent: false,
      frame: true,
      show: false,
      autoHideMenuBar: true,
      icon,
      ...options,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false
      }
    }
  }

  abstract onLoad(
    settings?: Settings,
    options?: BrowserWindowConstructorOptions
  ): Promise<void> | void

  show(): void {
    this.window?.show()
    this.window?.focus()
  }

  hide(): void {
    this.window?.hide()
  }

  init(path: string = '', show: boolean = false): Promise<void> {
    const window = new BrowserWindow(this.options)

    this.window = window

    if (show) {
      this.window.on('ready-to-show', () => {
        window.show()
      })
    }

    this.window.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    return this.open(path, show)
  }

  async open(path: string = '', show: boolean = true): Promise<void> {
    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      await this.window?.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/${path}`)
    } else {
      await this.window?.loadFile(`${join(__dirname, '../renderer/index.html')}/${path}`)
    }

    if (show) {
      this.window?.show()
      this.window?.focus()
    }
  }
}
