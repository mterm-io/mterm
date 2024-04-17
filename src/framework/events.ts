import { ipcMain, shell, IpcMainEvent } from 'electron'
import { BootstrapContext } from '../main/bootstrap'
import { RuntimeModel } from './runtime'

export function attach({ app, workspace }: BootstrapContext): void {
  ipcMain.on('open.workspace', async () => {
    await shell.openPath(workspace.folder)
  })

  ipcMain.on('system.exit', () => app.quit())
  ipcMain.on('runtime.prompt', (_, value: string) => {
    workspace.runtime.prompt = value
  })

  ipcMain.handle('runtimes', async (): Promise<RuntimeModel[]> => {
    return workspace.runtimes.map((runtime, index) => {
      return {
        target: index === workspace.runtimeIndex,
        ...runtime
      }
    })
  })

  ipcMain.handle('runtimeTarget', async (): Promise<number> => {
    return workspace.runtimeIndex
  })
}
