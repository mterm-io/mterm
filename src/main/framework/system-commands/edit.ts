import { ExecuteContext } from '../runtime'
import { pathExists, stat } from 'fs-extra'
import { RunnerWindow } from '../../window/windows/runner'
async function exit(context: ExecuteContext): Promise<void> {
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
    context.out('Settings reloaded\n')

    await context.workspace.settings.load()
    await context.workspace.applySettings(RunnerWindow)
  })
}

export default {
  command: ':edit',
  alias: ['edit'],
  task: exit
}
