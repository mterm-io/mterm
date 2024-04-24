import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: typeof electronAPI
    api: unknown
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
})
