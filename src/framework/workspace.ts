import { join, resolve } from 'path'
import { Settings } from './settings'
import { mkdirs, pathExists } from 'fs-extra'
import { homedir } from 'node:os'
import { MTermWindow } from '../main/window/mterm-window'
import { remove } from 'lodash'
import { BrowserWindowConstructorOptions } from 'electron'
import { setWindowValueFromPath } from '../main/util'

export class Workspace {
  public settings: Settings
  public isAppQuiting: boolean = false
  public windows: MTermWindow[] = []
  constructor(
    public folder: string,
    defaultSettings: object
  ) {
    /**
     * Cleanup and replace '~' with homedir location
     */
    this.folder = this.folder.replace('~', homedir())
    this.folder = resolve(this.folder)

    this.settings = new Settings(join(this.folder, 'settings.json'), defaultSettings)
  }

  hasWindowReady(window: MTermWindow): boolean {
    for (const currentWindow of this.windows) {
      if (Object.getPrototypeOf(window) === Object.getPrototypeOf(currentWindow)) {
        if (!currentWindow.browserWindow?.isDestroyed()) {
          /**
           * This window exists and is not destroyed!
           */
          return true
        }
      }
    }
    return false
  }

  async load(): Promise<Workspace> {
    const isExist = await pathExists(this.folder)
    if (!isExist) {
      await mkdirs(this.folder)
    }

    await this.settings.load()

    return this
  }

  addWindowToContext(window: MTermWindow): void {
    const toRemove: MTermWindow[] = this.windows.filter(
      (currentWindow) => Object.getPrototypeOf(window) === Object.getPrototypeOf(currentWindow)
    )

    remove(this.windows, (window) => toRemove.includes(window))

    this.windows.push(window)
  }

  show(ctor: typeof MTermWindow): void {
    for (const currentWindow of this.windows) {
      if (ctor.prototype === Object.getPrototypeOf(currentWindow)) {
        currentWindow.show()
      }
    }
  }
  async showAndHideOthers(ctor: typeof MTermWindow, path: string): Promise<void> {
    for (const currentWindow of this.windows) {
      if (ctor.prototype === Object.getPrototypeOf(currentWindow)) {
        await currentWindow.open(path, true)
      } else {
        currentWindow.hide()
      }
    }
  }
  hide(ctor: typeof MTermWindow): void {
    for (const currentWindow of this.windows) {
      if (ctor.prototype === Object.getPrototypeOf(currentWindow)) {
        currentWindow.hide()
      }
    }
  }

  toggle(ctor: typeof MTermWindow): void {
    for (const currentWindow of this.windows) {
      if (ctor.prototype === Object.getPrototypeOf(currentWindow)) {
        if (currentWindow.browserWindow?.isVisible()) {
          currentWindow.hide()
        } else {
          currentWindow.show()
        }
      }
    }
  }
  async applySettings(): Promise<void> {
    for (const currentWindow of this.windows) {
      const options = currentWindow.options
      const currentBrowserWindow = currentWindow.browserWindow
      if (currentBrowserWindow === undefined) {
        return
      }

      const [currentX, currentY] = currentBrowserWindow.getPosition()
      const [currentW, currentH] = currentBrowserWindow.getSize()

      const pending: Partial<BrowserWindowConstructorOptions> = {
        x: currentX,
        y: currentY,
        width: currentW,
        height: currentH
      }

      const valuePairNames = ['x', 'y', 'width', 'height']
      const valueRecreateNames = ['frame', 'transparent']

      let isRecreateRequired = false

      const handler: ProxyHandler<BrowserWindowConstructorOptions> = {
        set(
          target: BrowserWindowConstructorOptions,
          prop: string | symbol,
          newValue,
          receiver
        ): boolean {
          const priorValue = receiver[prop]
          const isValueFromPair = valuePairNames.includes(prop.toString())
          const set = Reflect.set(target, prop, newValue, receiver)

          if (!isValueFromPair && priorValue === newValue) {
            return set
          }

          if (valueRecreateNames.includes(prop.toString())) {
            isRecreateRequired = true
            return set
          }

          if (isValueFromPair) {
            pending[prop] = newValue
          } else if (!isRecreateRequired) {
            setWindowValueFromPath(currentBrowserWindow, prop.toString(), newValue)
          }

          return set
        }
      }

      const proxy = new Proxy(options, handler)

      await currentWindow.preInitChanges(this.settings, proxy)

      if (isRecreateRequired) {
        await currentWindow.recreate(this)

        currentWindow.browserWindow?.focus()
      } else {
        currentBrowserWindow.setSize(pending.width ?? currentW, pending.height ?? currentH)
        currentBrowserWindow.setPosition(pending.x ?? currentX, pending.y ?? currentY)
      }
    }
  }
}
