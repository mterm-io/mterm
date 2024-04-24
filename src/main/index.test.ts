import { app } from 'electron'
import { PlatformWindow } from './window/windows/platform'
import { RunnerWindow } from './window/windows/runner'
import { Workspace } from './framework/workspace'
import { DEFAULT_SETTINGS, DEFAULT_WORKSPACE } from '../constants'
import { ErrorModal } from './window/windows/error-modal'
import { boostrap, BootstrapContext } from './bootstrap'

jest.mock('electron', () => ({
  app: {
    on: jest.fn(),
    quit: jest.fn()
  }
}))

jest.mock('./window/windows/platform')
jest.mock('./window/windows/runner')
jest.mock('./framework/workspace')
jest.mock('./window/windows/error-modal')
jest.mock('./bootstrap')

describe('Main', () => {
  test('creates instances of Workspace, RunnerWindow, PlatformWindow, and ErrorModal', () => {
    require('./index')

    expect(Workspace).toHaveBeenCalledWith(DEFAULT_WORKSPACE, DEFAULT_SETTINGS)
    expect(RunnerWindow).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        width: 1800,
        height: 600,
        transparent: true,
        movable: false,
        maximizable: false,
        enableLargerThanScreen: true,
        title: 'MTERM'
      }),
      '',
      true
    )
    expect(PlatformWindow).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        width: 600,
        height: 600
      }),
      'store',
      false
    )
    expect(ErrorModal).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        width: 600,
        height: 600
      }),
      'error',
      false
    )
  })

  test('calls bootstrap with the correct arguments', () => {
    require('./index')

    expect(boostrap).toHaveBeenCalledWith({
      icon: expect.any(String),
      workspace: expect.any(Workspace),
      windows: expect.arrayContaining([
        expect.any(RunnerWindow),
        expect.any(PlatformWindow),
        expect.any(ErrorModal)
      ]),
      errorModal: expect.any(ErrorModal),
      app: app
    })
  })
})
