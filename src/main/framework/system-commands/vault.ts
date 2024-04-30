import { ExecuteContext } from '../runtime'
import { PlatformWindow } from '../../window/windows/platform'

async function vault(context: ExecuteContext): Promise<void> {
  await context.workspace.showAndHideOthers(PlatformWindow, 'store')
}

export default {
  command: ':vault',
  task: vault
}
