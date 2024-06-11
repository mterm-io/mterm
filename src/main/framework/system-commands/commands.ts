import { ExecuteContext } from '../execute-context'
import { errorModal } from '../../index'
import { Commands } from '../commands'

export async function addCommand(context: ExecuteContext, cmd: string): Promise<void> {
  if (!cmd) {
    context.out('Provide a command name to add\n\nExample: :cmd add restart_explorer\n\n', true)
    context.finish(1)
    return
  }

  if (context.workspace.commands.has(cmd)) {
    context.out('Command already exists\n', true)
    context.finish(1)
    return
  }

  context.out(`Adding command: ${cmd}\n`)

  console.log('Adding command:', cmd)

  await context.workspace.commands.addCommand(cmd, `return 'Running ${cmd}!'`)

  context.out('Command added\n')

  await context.workspace.commands.load(context.workspace.settings)

  context.out('Command reloaded\n')

  await context.edit(context.workspace.commands.getCommandFileLocation(cmd), async () => {
    context.out(`${cmd} reloaded\n`)
    await context.workspace.commands.load(context.workspace.settings)
  })
}

export default {
  command: ':commands',
  alias: [':commands', ':cmd', ':c'],
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

        try {
          await context.workspace.commands.load(context.workspace.settings)
        } catch (e) {
          console.log(e)
          await errorModal.showError(e)
        }

        context.out('Commands reloaded\n')
      })
    } else if (task === 'add') {
      const cmd = Commands.toCommandName(context.prompt.args[1] || '')

      await addCommand(context, cmd)
    } else if (task === 'remove') {
      const cmd = Commands.toCommandName(context.prompt.args[1] || '')

      await context.workspace.commands.removeCommand(cmd)

      context.out('Command removed\n')
    } else if (task.trim()) {
      const cmd = Commands.toCommandName(task || '')
      if (context.workspace.commands.has(cmd)) {
        context.out(`Editing command: ${cmd}\n`)
        await context.edit(context.workspace.commands.getCommandFileLocation(cmd), async () => {
          context.out(`${cmd} reloaded\n`)
          await context.workspace.commands.load(context.workspace.settings)
        })
      } else {
        await addCommand(context, cmd)
      }
    }
  }
}
