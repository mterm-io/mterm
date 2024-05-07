import { ExecuteContext } from '../runtime'
async function exit(context: ExecuteContext): Promise<void> {
  context.out('edit that file')
}

export default {
  command: ':edit',
  alias: ['edit'],
  task: exit
}
