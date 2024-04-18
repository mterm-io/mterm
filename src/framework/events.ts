import { ipcMain, shell } from 'electron'
import { BootstrapContext } from '../main/bootstrap'
import { Command, RuntimeModel } from './runtime'
import short from 'short-uuid'

export function attach({ app, workspace }: BootstrapContext): void {
  ipcMain.on('open.workspace', async () => {
    await shell.openPath(workspace.folder)
  })

  ipcMain.on('system.exit', () => app.quit())
  ipcMain.on('runtime.prompt', (_, value: string) => {
    workspace.runtime.prompt = value
  })

  ipcMain.handle('runtime.execute', async (): Promise<string> => {
    const prompt = workspace.runtime.prompt
    const id = short.generate()

    const command: Command = {
      id,
      prompt,
      result: ''
    }

    // clear current prompt
    workspace.runtime.history.unshift(command)
    workspace.runtime.prompt = ''

    return new Promise((resolve) => {
      setTimeout(() => {
        const result = `result of ${prompt}`

        command.result = result

        resolve(result)
      }, 1000)
    })
  })

  ipcMain.handle('runtimes', async (): Promise<RuntimeModel[]> => {
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
  })

  ipcMain.handle('runtimeTarget', async (): Promise<number> => {
    return workspace.runtimeIndex
  })
}
