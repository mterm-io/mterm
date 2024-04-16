import { toNumber } from 'lodash'
import { RunnerBounds } from './model'
import { BrowserWindow, Display, screen } from 'electron'

export function getBoundaryValue(
  value: string | number,
  containerLength: number,
  contentLength: string | number
): number {
  if (typeof value === 'string') {
    const [, ratio] = value.split(':')

    let computedValue = containerLength

    if (ratio && ratio !== '0') {
      const ratioAsNumber = toNumber(ratio)

      const height = toNumber(contentLength)

      const offset = height * ratioAsNumber

      computedValue += offset
      computedValue += -(containerLength / 2)
    }

    return computedValue
  } else {
    return value
  }
}

export function getDisplay(bounds: RunnerBounds): Display {
  const boundsScreen = bounds.screen
  if (typeof boundsScreen === 'string') {
    return screen.getPrimaryDisplay()
  }
  const displays = screen.getAllDisplays()

  if (boundsScreen >= 0 && boundsScreen <= displays.length - 1) {
    return displays[boundsScreen]
  }

  return screen.getPrimaryDisplay()
}

export function setWindowValueFromPath(window: BrowserWindow, prop: string, value): void {
  switch (prop) {
    case 'skipTaskbar':
      window.setSkipTaskbar(value)
      break
    case 'titleBarOverlay':
      window.setTitleBarOverlay(value)
      break
    case 'movable':
      window.setMovable(value)
      break
    case 'alwaysOnTop':
      window.setAlwaysOnTop(value)

      if (value) {
        window.show()
        window.focus()
      }
      break
    case 'maximizable':
      window.setMaximizable(value)
      break
    default:
      console.error('No handler for = ', prop)
      break
  }
}
