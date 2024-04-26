import { ExecuteContext } from '../runtime'

export default {
  command: 'cls',
  async task(context: ExecuteContext): Promise<void> {
    context.out('')
  }
}
