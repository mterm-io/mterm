import { ExecuteContext } from '../execute-context'
import { remove } from 'fs-extra'
import { RunnerWindow } from '../../window/windows/runner'
async function reset(context: ExecuteContext): Promise<boolean> {
  context.out('Reset all mterm settings, commands, modules?\n')

  const yes = context.content(`<button>Yes</button>`)

  context.out('|')

  const no = context.content(`<button>No</button>`)

  no.on('click', () => {
    context.out('\n\nDeclined reset')
    context.finish(0)
  })

  yes.on('click', async () => {
    context.out('\n\nCleaning...')

    await remove(context.workspace.folder)

    context.out('\nReloading...')

    await context.workspace.load()
    context.out('- settings reloaded \n')

    await context.workspace.commands.load(context.workspace.settings)
    context.out('- commands reloaded \n')

    await context.workspace.reload(RunnerWindow)
    context.out('- window reloaded \n')

    context.finish(0)
  })

  return false
}

export default {
  command: ':reset',
  alias: ['reset'],
  task: reset
}
