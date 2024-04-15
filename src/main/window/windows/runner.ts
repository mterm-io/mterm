import { MTermWindow } from '../mterm-window'
import { Settings } from '../../../framework/settings'
import { BrowserWindowConstructorOptions } from 'electron'

export class RunnerWindow extends MTermWindow {
  onLoad(settings: Settings, options: BrowserWindowConstructorOptions): void {
    const height = settings.get<number>('runner.height', 500)

    let width = settings.get<string | number>('runner.width', 'SCREEN')

    if (typeof width === 'string') {
      width = 3840
    }

    options.height = height
    options.width = width
    options.alwaysOnTop = true
  }
}
