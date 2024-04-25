import { ExecuteContext } from '../runtime'
import { resolve } from 'path'
import { resolveFolderPathForMTERM } from '../workspace'
import { pathExists } from 'fs-extra'

export default {
  command: 'cd',
  async task(context: ExecuteContext): Promise<void> {
    const [, ...args] = context.command.prompt.split(' ')

    const path: string = args[0] || '.'

    let location = resolve(context.runtime.folder, path)
    if (path.startsWith('~')) {
      location = resolveFolderPathForMTERM(path)
    }

    const isLocationActive = await pathExists(location)

    if (!isLocationActive) {
      context.out(`Folder not found \n\n${location}`, true)
      context.finish(1)
      return
    }

    context.runtime.folder = location
  }
}
