import { ipcMain, shell } from 'electron'
import { BootstrapContext } from '../bootstrap'
import {
  Command,
  CommandViewModel,
  Profile,
  ProfileMap,
  Result,
  ResultStream,
  ResultStreamEvent,
  Runtime,
  RuntimeModel
} from './runtime'
import short from 'short-uuid'
import { execute } from './runtime-executor'
import createDOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'
import {
  DEFAULT_HISTORY_ENABLED,
  DEFAULT_HISTORY_MAX_ITEMS,
  DEFAULT_HISTORY_SAVE_RESULT,
  DEFAULT_PROFILE,
  DEFAULT_PROFILES,
  DEFAULT_SETTING_IS_COMMANDER_MODE
} from '../../constants'
import Convert from 'ansi-to-html'
import { HistoricalExecution } from './history'
import { readFile, writeFile } from 'fs-extra'

const convert = new Convert()
const DOMPurify = createDOMPurify(new JSDOM('').window)
export function attach({ app, workspace }: BootstrapContext): void {
  const runtimeList = (): RuntimeModel[] => {
    return workspace.runtimes.map((runtime, index) => {
      const isTarget = index === workspace.runtimeIndex
      const focus = runtime.history.find((cmd) => cmd.id === runtime.commandFocus)

      const result = focus
        ? {
            ...focus.result,
            edit: focus.result.edit
              ? {
                  ...focus.result.edit,
                  callback: undefined
                }
              : undefined
          }
        : {
            code: 0,
            stream: []
          }

      const history: CommandViewModel[] = runtime.history.map((historyItem) => {
        return {
          ...historyItem,
          process: undefined,
          result: {
            ...historyItem.result,
            edit: historyItem.result.edit
              ? {
                  content: historyItem.result.edit.content,
                  path: historyItem.result.edit.path,
                  modified: historyItem.result.edit.modified
                }
              : undefined
          }
        }
      })

      return {
        target: isTarget,
        result: runtime.resultEdit
          ? {
              code: 0,
              stream: [
                {
                  text: runtime.resultEdit,
                  raw: runtime.resultEdit,
                  error: false
                }
              ]
            }
          : result,
        ...runtime,
        history,
        appearance: {
          ...runtime.appearance,

          title: runtime.appearance.title.replace('$idx', `${index}`)
        }
      }
    })
  }

  ipcMain.handle(
    'runtime.set-edit',
    async (_, runtimeId: string, commandId: string, result: string): Promise<boolean> => {
      const runtime = workspace.runtimes.find((r) => r.id === runtimeId)
      if (!runtime) {
        return false
      }

      if (!commandId) {
        commandId = runtime.commandFocus
      }

      const command = runtime.history.find((c) => c.id === commandId)
      if (!command || !command.result.edit) {
        return false
      }

      command.result.edit.content = result
      command.result.edit.modified = true

      return true
    }
  )

  ipcMain.handle(
    'runtime.save-edit',
    async (_, runtimeId: string, commandId: string): Promise<boolean> => {
      const runtime = workspace.runtimes.find((r) => r.id === runtimeId)
      if (!runtime) {
        return false
      }

      if (!commandId) {
        commandId = runtime.commandFocus
      }

      const command = runtime.history.find((c) => c.id === commandId)
      if (!command || !command.result.edit) {
        return false
      }

      command.result.edit.modified = false

      await writeFile(command.result.edit.path, command.result.edit.content)

      await command.result.edit.callback(command.result.edit.content)

      return true
    }
  )

  ipcMain.handle(
    'runtime.set-result',
    async (_, runtimeId: string, commandId: string, result: string): Promise<boolean> => {
      const runtime = workspace.runtimes.find((r) => r.id === runtimeId)
      if (!runtime) {
        return false
      }

      if (!commandId) {
        runtime.resultEdit = result
      } else {
        const command = runtime.history.find((c) => c.id === commandId)
        if (!command || !command.complete) {
          return false
        }

        command.result = {
          code: command.result.code,
          stream: [
            {
              text: result,
              raw: result,
              error: command.error
            }
          ]
        }
      }

      return true
    }
  )

  ipcMain.handle('runtime.reset-focus', async (_, runtimeId: string): Promise<boolean> => {
    const runtime = workspace.runtimes.find((r) => r.id === runtimeId)
    if (!runtime) {
      return false
    }

    runtime.resultEdit = ''
    return true
  })

  ipcMain.handle('runner.isCommanderMode', async (): Promise<boolean> => {
    return workspace.settings.get<boolean>(
      'runner.commanderMode',
      DEFAULT_SETTING_IS_COMMANDER_MODE
    )
  })

  ipcMain.handle('runtime.kill', async (_, commandId, runtimeId): Promise<boolean> => {
    const runtime = workspace.runtimes.find((r) => r.id === runtimeId)
    if (!runtime) {
      return false
    }
    const command = runtime.history.find((c) => c.id === commandId)
    if (!command) {
      return false
    }

    if (command.process) {
      try {
        command.process.kill(0)
      } catch (e) {
        console.error(e)
      }
    }
    if (!command.complete) {
      command.aborted = true
    }
    command.complete = true

    return true
  })

  ipcMain.handle('history.try-scroll-next', async (_, runtimeId): Promise<boolean> => {
    const runtime = workspace.runtimes.find((r) => r.id === runtimeId)
    if (!runtime) {
      return false
    }
    const enabled: boolean = workspace.settings.get<boolean>(
      'history.enabled',
      DEFAULT_HISTORY_ENABLED
    )
    if (!enabled) {
      return false
    }

    const rewind: HistoricalExecution | undefined = workspace.history.rewind()
    if (rewind === undefined) {
      return false
    }

    const command: Command = {
      prompt: rewind.prompt,
      error: rewind.error,
      aborted: rewind.aborted,
      runtime: runtimeId,
      id: short.generate(),
      complete: true,
      result: {
        code: rewind.code,
        stream: !rewind.result
          ? []
          : rewind.result.map((raw) => {
              let text = raw.toString()

              text = DOMPurify.sanitize(raw)
              text = convert.toHtml(text)

              return {
                error: rewind.error,
                raw,
                text: text
              }
            })
      }
    }

    runtime.history.push(command)

    return true
  })

  ipcMain.handle('runtime.rename', async (_, runtimeId, name): Promise<boolean> => {
    const runtime = workspace.runtimes.find((r) => r.id === runtimeId)
    if (!runtime) {
      return false
    }

    runtime.appearance.title = name

    return true
  })

  ipcMain.handle('runtime.duplicate', async (_, runtimeId): Promise<boolean> => {
    const runtime = workspace.runtimes.find((r) => r.id === runtimeId)
    if (!runtime) {
      return false
    }

    const duplicatedRuntime = new Runtime(runtime.folder)

    duplicatedRuntime.appearance.title = runtime.appearance.title
    duplicatedRuntime.profile = runtime.profile
    duplicatedRuntime.prompt = runtime.prompt

    workspace.runtimes.push(duplicatedRuntime)

    return true
  })

  ipcMain.handle('runtime.close-right', async (_, runtimeId): Promise<boolean> => {
    const runtime = workspace.runtimes.find((r) => r.id === runtimeId)
    if (!runtime) {
      return false
    }

    const runtimeIndex = workspace.runtimes.indexOf(runtime)
    const runtimesToDelete = workspace.runtimes.filter((_, index) => index > runtimeIndex)

    runtimesToDelete.forEach((runtime) => workspace.removeRuntime(runtime))

    workspace.runtimeIndex = runtimeIndex

    return true
  })

  ipcMain.handle('runtime.close-others', async (_, runtimeId): Promise<boolean> => {
    const runtime = workspace.runtimes.find((r) => r.id === runtimeId)
    if (!runtime) {
      return false
    }

    const runtimesToDelete = workspace.runtimes.filter((_) => _.id !== runtimeId)

    runtimesToDelete.forEach((runtime) => workspace.removeRuntime(runtime))

    workspace.runtimeIndex = 0

    return true
  })

  ipcMain.handle('runtime.close', async (_, runtimeId): Promise<boolean> => {
    const runtime = workspace.runtimes.find((r) => r.id === runtimeId)
    if (!runtime) {
      return false
    }

    if (!workspace.removeRuntime(runtime)) {
      app.quit()
    }

    return true
  })

  ipcMain.on('open.workspace', async () => {
    await shell.openPath(workspace.folder)
  })

  ipcMain.handle('store.is', async () => {
    return await workspace.store.exists()
  })

  ipcMain.handle('store.setup', async (_, password) => {
    workspace.store.vault = {}
    await workspace.store.save(password)
    return await workspace.store.open(password)
  })

  ipcMain.handle('store.unlocked', async () => {
    return workspace.store.unlocked
  })

  ipcMain.handle('store.save', async (_, store) => {
    workspace.store.vault = store
    await workspace.store.save()
    return store
  })

  ipcMain.handle('store.unlock', async (_, password: string) => {
    return await workspace.store.open(password)
  })

  ipcMain.handle('store.model', async () => {
    return workspace.store.vault
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

  ipcMain.handle('runtime.prepareExecute', async (_, runtimeId, prompt): Promise<Command> => {
    const runtime = workspace.runtimes.find((runtime) => runtimeId === runtime.id)
    if (!runtime) {
      throw `Runtime '${runtimeId}' does not exist`
    }

    runtime.resultEdit = ''

    const id = short.generate()

    const command: Command = {
      id,
      prompt,
      error: false,
      complete: false,
      aborted: false,
      result: {
        code: 0,
        stream: [],
        edit: undefined
      },
      runtime: runtime.id
    }

    // clear current prompt
    runtime.commandFocus = command.id
    runtime.history.unshift(command)
    runtime.prompt = ''

    return command
  })

  ipcMain.handle('runtime.execute', async (_, { id, runtime }: Command): Promise<boolean> => {
    const runtimeTarget = workspace.runtimes.find((r) => r.id === runtime)
    if (!runtimeTarget) {
      throw `Runtime '${runtime}' does not exist`
    }

    const command = runtimeTarget.history.find((cmd) => cmd.id === id && cmd.runtime === runtime)
    if (!command) {
      throw `Command '${id}' in runtime '${runtimeTarget}' does not exist`
    }

    let profileKey = runtimeTarget.profile
    if (profileKey === 'default') {
      profileKey = workspace.settings.get<string>('defaultProfile', DEFAULT_PROFILE)
    }

    const history = {
      enabled: workspace.settings.get<boolean>('history.enabled', DEFAULT_HISTORY_ENABLED),
      results: workspace.settings.get<boolean>('history.saveResult', DEFAULT_HISTORY_SAVE_RESULT),
      max: workspace.settings.get<number>('history.maxItems', DEFAULT_HISTORY_MAX_ITEMS)
    }

    const profiles = workspace.settings.get<ProfileMap>('profiles', DEFAULT_PROFILES)
    const profile: Profile = profiles[profileKey]

    const result: Result = command.result
    const start = Date.now()

    let finalize: boolean = true

    const finish = (code: number): void => {
      if (command.aborted || command.complete) {
        return
      }

      result.code = code

      command.complete = true
      command.error = result.code !== 0

      if (history.enabled) {
        workspace.history.append(command, start, profileKey, history.results)
      }
    }

    try {
      const out = (text: string, error: boolean = false): void => {
        if (!command.result.edit && (command.aborted || command.complete)) {
          return
        }

        const raw = text.toString()

        text = DOMPurify.sanitize(raw)
        text = convert.toHtml(text)

        const streamEntry: ResultStream = {
          text,
          error,
          raw
        }

        result.stream.push(streamEntry)

        const streamEvent: ResultStreamEvent = {
          entry: streamEntry,
          runtime: runtime,
          command: id
        }

        if (!_.sender.isDestroyed()) {
          _.sender.send('runtime.commandEvent', streamEvent)
        }
      }

      if (!profile) {
        throw `Profile ${profileKey} does not exist, provided by runtime as = ${runtimeTarget.profile}`
      }

      const platform = profile.platform
      const finalizeConfirm = await execute({
        platform,
        workspace,
        runtime: runtimeTarget,
        command,
        async edit(path: string, callback: (text: string) => void) {
          const file = await readFile(path)

          this.command.result = {
            code: 0,
            stream: [],
            edit: {
              path,
              modified: false,
              content: file.toString(),
              callback
            }
          }

          _.sender.send('runtime.commandEvent')
        },
        out,
        finish
      })
      if (finalizeConfirm !== undefined && finalizeConfirm === false) {
        finalize = false
      }
    } catch (e) {
      result.stream.push({
        error: true,
        text: `${e}`,
        raw: `${e}`
      })
      finish(1)
    }

    if (finalize) {
      command.complete = true
      command.error = result.code !== 0

      finish(result.code)
    }

    return true
  })

  ipcMain.handle('runtimes', async (): Promise<RuntimeModel[]> => {
    return runtimeList()
  })

  ipcMain.handle('runtimeTarget', async (): Promise<number> => {
    return workspace.runtimeIndex
  })
}
