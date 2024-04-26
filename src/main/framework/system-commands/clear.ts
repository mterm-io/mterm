import { ExecuteContext } from '../runtime'

export default {
  command: 'clear',
  async task(context: ExecuteContext): Promise<void> {
    context.out('')
  }
}
