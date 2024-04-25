import { ExecuteContext } from '../runtime'
import { RunnerWindow } from '../../window/windows/runner'

async function reload(context: ExecuteContext): Promise<void> {
  await context.workspace.commands.load()
  context.out('- commands reloaded \n')

  await context.workspace.load()
  context.out('- settings reloaded \n')

  await context.workspace.reload(RunnerWindow)
  context.out('- window reloaded \n')
}

export default {
  command: ':reload',
  task: reload
}
