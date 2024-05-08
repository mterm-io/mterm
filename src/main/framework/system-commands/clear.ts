import { ExecuteContext } from '../execute-context'

export default {
  command: 'clear',
  alias: ['cls'],
  async task(context: ExecuteContext): Promise<void> {
    context.out('')
  }
}
