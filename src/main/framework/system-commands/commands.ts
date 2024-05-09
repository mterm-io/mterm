import { ExecuteContext } from '../execute-context'
import { RunnerWindow } from '../../window/windows/runner'

export default {
  command: ':commands',
  alias: [':commands', ':cmd'],
  async task(context: ExecuteContext, task?: string): Promise<void> {
    context.out('')
    if (!task) {
      if (!context.workspace.commands.commandFileLocation) {
        context.out(
          'No command file to edit, make sure ~/mterm/package.json has a proper `main` field'
        )
        return
      }
      await context.edit(context.workspace.commands.commandFileLocation, async () => {
        context.out('Saved command file!\n')

        await context.workspace.commands.load(context.workspace.settings)

        context.out('Commands reloaded\n')
      })
    }
  }
}
