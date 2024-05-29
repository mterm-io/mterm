import { ExecuteContext } from '../execute-context'
import { ExtensionHook } from '../extensions'

async function ext(context: ExecuteContext, task?: string): Promise<void> {
  if (!task) {
    context.out(
      `ext list:
${context.workspace.extensions.extensionList.length > 0 ? '-' : ''}` +
        context.workspace.extensions.extensionList.join('\n-')
    )
    context.finish(0)
    return
  }
  if (task === 'load' || task === 'reload') {
    await context.workspace.extensions.load()
    context.out('Extensions loaded\n')
    context.finish(0)
    return
  }

  if (task === 'add') {
    const extName = (context.prompt.args[1] || '').trim()
    if (!extName) {
      context.out('No extension name provided\n\n:ext add EXT_NAME', true)
      context.finish(1)
      return
    }

    context.out(`Installing ${extName}..\n`)

    await context.runTask(process.env, context.workspace.folder, `npm install ${extName}`)

    await context.workspace.extensions.load()

    await context.workspace.extensions.executeFor(ExtensionHook.EXT_POST_INSTALL, extName, context)

    // context.out('Done\n')
  } else if (task === 'remove' || task === 'rm' || task === 'delete') {
    const extName = (context.prompt.args[1] || '').trim()
    if (!extName) {
      context.out('No extension name provided\n\n:ext rm EXT_NAME', true)
      context.finish(1)
      return
    }

    context.out(`Removing ${extName}..\n`)

    await context.runTask(process.env, context.workspace.folder, `npm rm ${extName}`)

    await context.workspace.extensions.load()

    context.out('Done\n')
  } else {
    context.out(
      'Unknown command\n\nTry :ext {add,remove} EXT_NAME or :ext to list current extensions',
      true
    )
    context.finish(1)
    return
  }
}

export default {
  command: ':ext',
  alias: [':extension', 'ext', 'extension'],
  task: ext
}
