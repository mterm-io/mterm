import { app } from 'electron'
import { ExecuteContext } from '../execute-context'

async function exit(context: ExecuteContext): Promise<void> {
  if (!context.workspace.removeRuntime(context.runtime)) {
    app.quit()

    console.log('QUIT')
  }

  context.out('..')
}

export default {
  command: ':exit',
  alias: ['exit'],
  task: exit
}
