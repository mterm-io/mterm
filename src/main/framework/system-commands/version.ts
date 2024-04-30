import { ExecuteContext } from '../runtime'
import { app } from 'electron'

export default {
  command: ':version',
  alias: [':v'],
  async task(context: ExecuteContext): Promise<void> {
    context.out(app.getVersion())
  }
}
