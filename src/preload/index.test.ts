import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: typeof electronAPI
    api: any
  }
}

jest.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: jest.fn() as jest.MockedFunction<typeof contextBridge.exposeInMainWorld>
  }
}))

describe('Preload', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('should expose Electron APIs and custom API when context isolation is enabled', () => {
    Object.defineProperty(process, 'contextIsolated', {
      value: true,
      configurable: true
    })

    require('./index')

    expect(contextBridge.exposeInMainWorld).toHaveBeenCalledTimes(2)
    expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith('electron', electronAPI)
    expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith('api', {})
  })

  test('should expose Electron APIs and custom API on window object when context isolation is disabled', () => {
    Object.defineProperty(process, 'contextIsolated', {
      value: false,
      configurable: true
    })

    require('./index')

    expect(contextBridge.exposeInMainWorld).not.toHaveBeenCalled()
    expect(window.electron).toBe(electronAPI)
    expect(window.api).toEqual({})
  })

  test('should handle errors when exposing APIs', () => {
    Object.defineProperty(process, 'contextIsolated', {
      value: true,
      configurable: true
    })
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    ;(
      contextBridge.exposeInMainWorld as jest.MockedFunction<typeof contextBridge.exposeInMainWorld>
    ).mockImplementationOnce(() => {
      throw new Error('Mocked error')
    })

    require('./index')

    expect(console.error).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledWith(expect.any(Error))

    consoleErrorSpy.mockRestore()
  })
})
