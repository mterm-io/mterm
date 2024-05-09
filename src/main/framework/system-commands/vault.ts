import { PlatformWindow } from '../../window/windows/platform'
import { ExecuteContext } from '../execute-context'

async function vault(context: ExecuteContext): Promise<void> {
  await context.workspace.showAndHideOthers(PlatformWindow, 'store')
}

export default {
  command: ':vault',
  task: vault
}
