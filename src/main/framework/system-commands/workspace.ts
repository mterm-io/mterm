import { shell } from 'electron'
import { ExecuteContext } from '../execute-context'

export default {
  command: ':workspace',
  async task(context: ExecuteContext): Promise<void> {
    await shell.openPath(context.workspace.folder)

    context.out('opened workspace in explorer')
  }
}
