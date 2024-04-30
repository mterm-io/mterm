import { BrowserWindow, BrowserWindowConstructorOptions, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { Settings } from '../framework/settings'
import { attachBrowserWindowListeners } from '../bootstrap/create-windows'
import { Workspace } from '../framework/workspace'

export abstract class MTermWindow {
  public browserWindow?: BrowserWindow
  public options: BrowserWindowConstructorOptions
  public path?: string = undefined

  constructor(
    icon: string,
    options: Partial<BrowserWindowConstructorOptions> = {},
    public defaultPath: string,
    public defaultShow: boolean
  ) {
    this.options = {
      width: 1800,
      height: 400,
      transparent: false,
      frame: true,
      show: false,
      autoHideMenuBar: true,
      maximizable: true,
      icon,
      ...options,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false
      }
    }
  }

  abstract preInitChanges(
    settings?: Settings,
    options?: BrowserWindowConstructorOptions
  ): Promise<void> | void

  abstract postInitChanges(settings?: Settings, win?: BrowserWindow): Promise<void> | void

  show(): void {
    this.browserWindow?.show()
    this.browserWindow?.focus()
  }

  hide(): void {
    this.browserWindow?.hide()
  }

  async recreate(workspace: Workspace): Promise<void> {
    this.path = undefined
    this.browserWindow?.destroy()
    await this.init()

    attachBrowserWindowListeners(this, workspace)
  }

  init(path: string = this.defaultPath, show: boolean = this.defaultShow): Promise<void> {
    const window = new BrowserWindow(this.options)

    this.browserWindow = window

    if (show) {
      this.browserWindow.on('ready-to-show', () => {
        window.show()
      })
    }

    this.browserWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    return this.open(path, show)
  }

  async open(path: string = '', show: boolean = true): Promise<void> {
    const isAlreadyOnPath = this.path !== undefined && this.path === path

    // don't reload the page
    this.path = path

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (!isAlreadyOnPath) {
      if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        await this.browserWindow?.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/${path}`)
      } else {
        await this.browserWindow?.loadFile(`${join(__dirname, `../renderer`, `index.html`)}`, {
          hash: path
        })
      }
    }

    if (show) {
      this.browserWindow?.show()
      this.browserWindow?.focus()
    }
  }
}
