import { ExecuteContext } from '../execute-context'

async function tab(context: ExecuteContext): Promise<void> {
  context.workspace.addRuntime()
  context.workspace.runtimeIndex = context.workspace.runtimes.length - 1

  context.out('->')
}

export default {
  command: ':tab',
  task: tab
}
