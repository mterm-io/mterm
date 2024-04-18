import { ipcMain, shell } from 'electron'
import { BootstrapContext } from '../main/bootstrap'
import { Command, Runtime, RuntimeModel } from './runtime'
import short from 'short-uuid'

export function attach({ app, workspace }: BootstrapContext): void {
  const runtimeList = (): RuntimeModel[] => {
    return workspace.runtimes.map((runtime, index) => {
      return {
        target: index === workspace.runtimeIndex,
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
  ipcMain.on('runtime.result', (_, value: string) => {
    workspace.runtime.result = value
  })
  ipcMain.on('runtime.index', (_, value: number) => {
    workspace.runtimeIndex = value
  })

  ipcMain.handle('runtimes.add', async (): Promise<RuntimeModel[]> => {
    workspace.addRuntime()

    return runtimeList()
  })

  ipcMain.handle('runtime.execute', async (): Promise<string> => {
    const runtime = workspace.runtime
    const prompt = runtime.prompt
    const id = short.generate()

    const command: Command = {
      id,
      prompt,
      result: ''
    }

    // clear current prompt
    runtime.history.unshift(command)
    runtime.prompt = ''

    return new Promise((resolve) => {
      setTimeout(() => {
        const result = `result of ${prompt}`

        command.result = result
        runtime.result = result

        resolve(result)
      }, 1000)
    })
  })

  ipcMain.handle('runtimes', async (): Promise<RuntimeModel[]> => {
    return runtimeList()
  })

  ipcMain.handle('runtimeTarget', async (): Promise<number> => {
    return workspace.runtimeIndex
  })
}
