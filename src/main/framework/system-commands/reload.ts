import { RunnerWindow } from '../../window/windows/runner'
import { ExecuteContext } from '../execute-context'

async function reload(context: ExecuteContext): Promise<void> {
  await context.workspace.load()
  context.out('- settings and themes reloaded \n')

  await context.workspace.commands.load(context.workspace.settings)
  context.out('- commands reloaded \n')

  await context.workspace.reload(RunnerWindow)
  context.out('- window reloaded \n')
}

export default {
  command: ':reload',
  task: reload
}
