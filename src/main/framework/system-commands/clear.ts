import { ExecuteContext } from '../runtime'

export default {
  command: 'clear',
  alias: ['cls'],
  async task(context: ExecuteContext): Promise<void> {
    context.out('')
  }
}
