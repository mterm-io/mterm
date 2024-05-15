import { transformer } from './index'
import { execute } from '../runtime-executor'

export const run: transformer = async (context, op) => {
  const isolatedContext = context.copyForPrompt(op)
  await execute(isolatedContext)
  return isolatedContext.command.result.stream.map((s) => s.raw).join()
}
