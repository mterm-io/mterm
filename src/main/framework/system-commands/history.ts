import { ExecuteContext } from '../runtime'

export default {
  command: ':history',
  task(context: ExecuteContext): void {
    context.out(JSON.stringify(context.runtime.history, null, 2))
  }
}
