import { join, resolve } from 'path'
import { Settings } from './settings'
import { mkdirs, pathExists } from 'fs-extra'
import { homedir } from 'node:os'
import { MTermWindow } from '../window/mterm-window'
import { remove } from 'lodash'
import { app, BrowserWindowConstructorOptions } from 'electron'
import { setWindowValueFromPath } from '../util'
import { Runtime } from './runtime'
import { DEFAULT_FOLDER, DEFAULT_HISTORY_ENABLED, DEFAULT_HISTORY_MAX_ITEMS } from '../../constants'
import { Commands } from './commands'
import { Store } from './store'
import { History } from './history'
import { Theme } from './theme'

export function resolveFolderPathForMTERM(folder: string): string {
  folder = folder.replace('~', homedir())
  folder = folder.replace('$CWD', process.cwd())

  folder = resolve(folder)

  return folder
}
export class Workspace {
  public store: Store
  public history: History
  public settings: Settings
  public commands: Commands
  public theme: Theme
  public isAppQuiting: boolean = false
  public windows: MTermWindow[] = []
  public runtimes: Runtime[] = []
  public runtimeIndex: number = 0
  constructor(
    public folder: string,
    defaultSettings: object
  ) {
    /**
     * Cleanup and replace '~' with homedir location
     */
    this.folder = resolveFolderPathForMTERM(this.folder)

    this.commands = new Commands(join(this.folder), join(app.getAppPath(), './resources/commands'))
    this.settings = new Settings(join(this.folder, 'settings.json'), defaultSettings)
    this.history = new History(join(this.folder, '.history'))
    this.store = new Store(join(this.folder, '.mterm-store'))
    this.theme = new Theme(this, join(app.getAppPath(), './resources/theme.css'))
  }

  get runtime(): Runtime {
    return this.runtimes[this.runtimeIndex]
  }

  removeRuntime(runtime: Runtime): boolean {
    const index = this.runtimes.indexOf(runtime)
    if (index !== -1) {
      remove(this.runtimes, runtime)

      if (this.runtimeIndex === index) {
        this.runtimeIndex-- // this cycles the runner closing from right to left

        if (this.runtimeIndex < 0) {
          this.runtimeIndex = 0
        }
      }
    } else if (this.runtimes.length === 1) {
      this.runtimeIndex = 0
    }

    return this.runtimes.length !== 0
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
    await this.theme.load()

    /**
     * Load an initial index
     */
    if (this.runtimes.length === 0) {
      const defaultFolder = this.settings.get<string>('folder', DEFAULT_FOLDER)

      this.runtimes.push(new Runtime(defaultFolder))

      this.runtimeIndex = 0
    }

    return this
  }

  addRuntime(): void {
    const defaultFolder = this.settings.get<string>('folder', DEFAULT_FOLDER)

    this.runtimes.push(new Runtime(defaultFolder))
  }

  addWindowToContext(window: MTermWindow): void {
    const toRemove: MTermWindow[] = this.windows.filter(
      (currentWindow) => Object.getPrototypeOf(window) === Object.getPrototypeOf(currentWindow)
    )

    remove(this.windows, (window) => toRemove.includes(window))

    this.windows.push(window)
  }

  async reload(ctor: typeof MTermWindow): Promise<void> {
    for (const currentWindow of this.windows) {
      if (ctor.prototype === Object.getPrototypeOf(currentWindow)) {
        await currentWindow.recreate(this)
      }
    }
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

  async persist(): Promise<void> {
    const saveHistory = this.settings.get<boolean>('history.enabled', DEFAULT_HISTORY_ENABLED)
    if (saveHistory) {
      const maxHistory = this.settings.get<number>('history.maxItems', DEFAULT_HISTORY_MAX_ITEMS)

      await this.history.write(maxHistory)
    }
  }

  resolve(path: string): string {
    let location = resolve(this.folder, path)
    if (path.startsWith('~')) {
      location = resolveFolderPathForMTERM(path)
    }

    return location
  }

  /**
   * Applies the updated settings to all the windows in the workspace.
   *
   * @returns {Promise<void>} A promise that resolves when the settings have been applied.
   */
  async applySettings(ctor?: typeof MTermWindow): Promise<void> {
    for (const currentWindow of this.windows) {
      if (ctor && ctor.prototype !== Object.getPrototypeOf(currentWindow)) {
        // target only the window provided
        // OR target all windows when not provided
        continue
      }

      const options = currentWindow.options
      const currentBrowserWindow = currentWindow.browserWindow
      if (currentBrowserWindow === undefined) {
        return
      }

      // Get the current position and size of the browser window
      const [currentX, currentY] = currentBrowserWindow.getPosition()
      const [currentW, currentH] = currentBrowserWindow.getSize()

      // Create an object to hold the pending changes to the window options
      const pending: Partial<BrowserWindowConstructorOptions> = {
        x: currentX,
        y: currentY,
        width: currentW,
        height: currentH
      }

      // Define the names of the window options that require recreation if changed
      const valueRecreateNames = ['frame', 'transparent']
      // Define the names of the window options that should not apply right away (aka pairs e.g: width+height)
      const valuePairNames = ['x', 'y', 'width', 'height']

      // Create a proxy handler for the window options
      const handler: ProxyHandler<BrowserWindowConstructorOptions> = {
        set(target, prop, newValue, receiver) {
          const priorValue = receiver[prop]
          const isValueFromPair = valuePairNames.includes(prop.toString())
          const set = Reflect.set(target, prop, newValue, receiver)

          // If the value hasn't changed, and it's not a value pair, return early
          // If this is a value pair and the value hasn't changed, we might see the other value in
          //   the pair change, for example when width is set to 100% of the screen but height
          //   remains the same. continue always for pairs
          if (!isValueFromPair && priorValue === newValue) {
            return set
          }

          // If the changed option requires recreation, set the flag on the receiver
          // these properties can not be set on BrowserWindow, so window must be recreated
          if (valueRecreateNames.includes(prop.toString())) {
            receiver.isRecreateRequired = true
            return set
          }

          // If it's a value pair, add the change to the pending object
          if (isValueFromPair) {
            pending[prop] = newValue
          } else if (!receiver.isRecreateRequired && prop !== 'isRecreateRequired') {
            // If recreation is not required and the property is not "isRecreateRequired",
            // apply the change directly to the browser window
            setWindowValueFromPath(currentBrowserWindow, prop.toString(), newValue)
          }

          return set
        }
      }

      // Create a proxy for the window options with the custom handler
      const proxy = new Proxy(options, handler)
      proxy['isRecreateRequired'] = false

      // Allow the current window to make changes before initialization
      await currentWindow.preInitChanges(this.settings, proxy)

      if (proxy['isRecreateRequired']) {
        // If recreation is required, recreate the window and focus it
        await currentWindow.recreate(this)
        currentWindow.browserWindow?.focus()
      } else {
        // If recreation is not required, apply the pending size and position changes
        currentBrowserWindow.setSize(pending.width ?? currentW, pending.height ?? currentH)
        currentBrowserWindow.setPosition(pending.x ?? currentX, pending.y ?? currentY)
      }
    }
  }
}
