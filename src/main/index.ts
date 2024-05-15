import { app } from 'electron'

import { PlatformWindow } from './window/windows/platform'
import { RunnerWindow } from './window/windows/runner'
import { Workspace } from './framework/workspace'

import { DEFAULT_SETTINGS, DEFAULT_WORKSPACE } from '../constants'
import { ErrorModal } from './window/windows/error-modal'
import { bootstrap } from './bootstrap'
import { join } from 'path'

const workspace = new Workspace(DEFAULT_WORKSPACE, DEFAULT_SETTINGS)

const icon = join(__dirname, '..', '..', 'resources', 'icon.png')
const runner = new RunnerWindow(
  icon,
  {
    width: 1800,
    height: 600,
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

export const errorModal = new ErrorModal(
  icon,
  {
    width: 600,
    height: 600,
    alwaysOnTop: true
  },
  'error',
  false
)

bootstrap({
  icon,
  workspace,
  windows: [runner, platform, errorModal],
  errorModal,
  app
})
