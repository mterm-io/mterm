import { app } from 'electron'

import icon from '../../resources/icon.png?asset'

import { PlatformWindow } from './window/windows/platform'
import { RunnerWindow } from './window/windows/runner'
import { Workspace } from '../framework/workspace'

import { DEFAULT_SETTINGS, DEFAULT_WORKSPACE } from '../constants'
import { ErrorModal } from './window/windows/error-modal'
import { boostrap } from './bootstrap'

const workspace = new Workspace(DEFAULT_WORKSPACE, DEFAULT_SETTINGS)

const runner = new RunnerWindow(
  icon,
  {
    width: 1800,
    height: 600,
    transparent: true,
    frame: false,
    movable: false,
    maximizable: false,
    enableLargerThanScreen: true,
    title: 'MTERM'
  },
  '',
  true
)

const platform = new PlatformWindow(
  icon,
  {
    width: 600,
    height: 600
  },
  'store',
  false
)

const errorModal = new ErrorModal(
  icon,
  {
    width: 600,
    height: 600
  },
  'error',
  false
)

boostrap({
  icon,
  workspace,
  windows: [runner, platform, errorModal],
  errorModal,
  app
}).then(() => {
  console.log('APP LOADED')
})
