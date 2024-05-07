import { ExecuteContext } from '../runtime'
import { pathExists, stat } from 'fs-extra'
async function exit(context: ExecuteContext): Promise<void> {
  context.out('edit that file')
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

  context.edit(path, (event: string) => {
    console.log('OH LAWD ', event)
  })
}

export default {
  command: ':edit',
  alias: ['edit'],
  task: exit
}
