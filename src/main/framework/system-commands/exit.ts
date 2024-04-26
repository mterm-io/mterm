import { ExecuteContext } from '../runtime'
import { app } from 'electron'

async function exit(context: ExecuteContext): Promise<void> {
  if (!context.workspace.removeRuntime(context.runtime)) {
    app.quit()

    console.log('QUIT')
  }

  context.out('..')
}

export default {
  command: ':reload',
  task: exit
}
