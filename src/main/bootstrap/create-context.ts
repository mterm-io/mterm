import { ContextMenuParams, shell } from 'electron'
import { BootstrapContext } from './index'
import contextMenu, { Actions } from 'electron-context-menu'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function createContext(_: BootstrapContext): Promise<void> {
  contextMenu({
    showSaveImageAs: true,
    prepend: (_: Actions, parameters: ContextMenuParams) => {
      return [
        {
          label: 'Search Google for “{selection}”',
          visible: parameters.selectionText.trim().length > 0,
          click: (): void => {
            shell.openExternal(
              `https://google.com/search?q=${encodeURIComponent(parameters.selectionText)}`
            )
          }
        }
      ]
    }
  })
}
