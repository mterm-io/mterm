import { pathExists, stat } from 'fs-extra'
import { ExecuteContext } from '../execute-context'

async function edit(context: ExecuteContext): Promise<void> {
  const [, ...args] = context.command.prompt.split(' ')
  const path: string = context.runtime.resolve(args[0] || '.')

  const isLocationActive = await pathExists(path)
  if (!isLocationActive) {
    context.out(`File \n\n${location}`, true)
    context.finish(1)
    return
  }

  const stats = await stat(path)
  if (!stats.isFile()) {
    context.out(`This path is not an editable file\n\n${path}`, true)
    context.finish(1)
    return
  }

  await context.edit(path, async () => {
    context.out('Saved changes!\n')
  })
}

export default {
  command: ':edit',
  alias: ['edit'],
  task: edit
}
