import { app } from 'electron'
import { ExecuteContext } from '../execute-context'

export default {
  command: ':version',
  alias: [':v'],
  async task(context: ExecuteContext): Promise<void> {
    context.out(app.getVersion())
  }
}
