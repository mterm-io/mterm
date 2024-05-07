import { ExecuteContext } from '../runtime'
import { pathExists, stat } from 'fs-extra'

export default {
  command: 'cd',
  async task(context: ExecuteContext): Promise<void> {
    const [, ...args] = context.command.prompt.split(' ')

    const path: string = context.runtime.resolve(args[0] || '.')

    const isLocationActive = await pathExists(path)

    if (!isLocationActive) {
      context.out(`Folder not found \n\n${path}`, true)
      context.finish(1)
      return
    }

    const stats = await stat(path)
    if (!stats.isDirectory()) {
      context.out(`This is not a folder mterm can navigate \n\n${path}`, true)
      context.finish(1)
      return
    }

    context.runtime.folder = path
  }
}
