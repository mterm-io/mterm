import { ipcMain, shell } from 'electron'
import { BootstrapContext } from '../main/bootstrap'
import { Command, RuntimeModel } from './runtime'
import short from 'short-uuid'

export function attach({ app, workspace }: BootstrapContext): void {
  const runtimeList = (): RuntimeModel[] => {
    return workspace.runtimes.map((runtime, index) => {
      const isTarget = index === workspace.runtimeIndex
      return {
        target: isTarget,
        result: runtime.commandFocus
          ? runtime.history.find((cmd) => cmd.id === runtime.commandFocus)?.result || ''
          : '',
        ...runtime,
        appearance: {
          ...runtime.appearance,

          title: runtime.appearance.title.replace('$idx', `${index}`)
        }
      }
    })
  }
  ipcMain.on('open.workspace', async () => {
    await shell.openPath(workspace.folder)
  })

  ipcMain.on('system.exit', () => app.quit())
  ipcMain.on('runtime.prompt', (_, value: string) => {
    workspace.runtime.prompt = value
  })
  ipcMain.on('runtime.index', (_, value: number) => {
    workspace.runtimeIndex = value
  })

  ipcMain.handle('runtimes.add', async (): Promise<RuntimeModel[]> => {
    workspace.addRuntime()

    return runtimeList()
  })

  ipcMain.handle('runtime.prepareExecute', async (_, runtimeId): Promise<Command> => {
    const runtime = workspace.runtimes.find((runtime) => runtimeId === runtime.id)
    if (!runtime) {
      throw `Runtime '${runtimeId}' does not exist`
    }

    const prompt = runtime.prompt
    const id = short.generate()

    const command: Command = {
      id,
      prompt,
      result: '',
      runtime: runtime.id
    }

    // clear current prompt
    runtime.commandFocus = command.id
    runtime.history.unshift(command)
    runtime.prompt = ''

    return command
  })

  ipcMain.handle('runtime.execute', async (_, { id, runtime }: Command): Promise<Command> => {
    const runtimeTarget = workspace.runtimes.find((r) => r.id === runtime)
    if (!runtimeTarget) {
      throw `Runtime '${runtime}' does not exist`
    }

    const command = runtimeTarget.history.find((cmd) => cmd.id === id && cmd.runtime === runtime)
    if (!command) {
      throw `Command '${id}' in runtime '${runtimeTarget}' does not exist`
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        command.result = `result of ${command.id} = ${command.prompt}`

        resolve(command)
      }, 5000)
    })
  })

  ipcMain.handle('runtimes', async (): Promise<RuntimeModel[]> => {
    return runtimeList()
  })

  ipcMain.handle('runtimeTarget', async (): Promise<number> => {
    return workspace.runtimeIndex
  })
}
