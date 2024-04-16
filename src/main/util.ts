import { toNumber } from 'lodash'
import { ComputedBounds, RunnerBounds } from './model'
import { Display, screen } from 'electron'
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
  if (boundsScreen > 0 && boundsScreen <= displays.length - 1) {
    return displays[boundsScreen]
  }

  return screen.getPrimaryDisplay()
}

export function getBounds(
  bounds: RunnerBounds,
  commanderMode: boolean,
  commanderModeBounds: RunnerBounds
): ComputedBounds {
  const boundary = commanderMode ? commanderModeBounds : bounds
  const display = getDisplay(boundary)

  const x = getBoundaryValue(boundary.x, display.size.width, boundary.w)
  const y = getBoundaryValue(boundary.y, display.size.height, boundary.h)

  const w = getBoundaryValue(boundary.w, display.size.width, boundary.w)
  const h = getBoundaryValue(boundary.h, display.size.height, boundary.h)

  return {
    x,
    y,
    w,
    h
  }
}
