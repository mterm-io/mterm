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
  RuntimeModel
} from './runtime'
import short from 'short-uuid'
import { execute } from './runtime-executor'
import createDOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'
import {
  DEFAULT_PROFILE,
  DEFAULT_PROFILES,
  DEFAULT_SETTING_IS_COMMANDER_MODE
} from '../../constants'
import Convert from 'ansi-to-html'

const convert = new Convert()
const DOMPurify = createDOMPurify(new JSDOM('').window)
export function attach({ app, workspace }: BootstrapContext): void {
  const runtimeList = (): RuntimeModel[] => {
    return workspace.runtimes.map((runtime, index) => {
      const isTarget = index === workspace.runtimeIndex
      const focus = runtime.history.find((cmd) => cmd.id === runtime.commandFocus)

      const result = focus
        ? focus.result
        : {
            code: 0,
            stream: []
          }

      const history: CommandViewModel[] = runtime.history.map((historyItem) => {
        return {
          ...historyItem,
          process: undefined
        }
      })

      return {
        target: isTarget,
        result,
        ...runtime,
        history,
        appearance: {
          ...runtime.appearance,

          title: runtime.appearance.title.replace('$idx', `${index}`)
        }
      }
    })
  }

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

  ipcMain.handle('runtime.rename', async (_, runtimeId, name): Promise<boolean> => {
    const runtime = workspace.runtimes.find((r) => r.id === runtimeId)
    if (!runtime) {
      return false
    }

    runtime.appearance.title = name

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

    const id = short.generate()

    const command: Command = {
      id,
      prompt,
      error: false,
      complete: false,
      aborted: false,
      result: {
        code: 0,
        stream: []
      },
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

    let profileKey = runtimeTarget.profile
    if (profileKey === 'default') {
      profileKey = workspace.settings.get<string>('defaultProfile', DEFAULT_PROFILE)
    }

    const profiles = workspace.settings.get<ProfileMap>('profiles', DEFAULT_PROFILES)
    const profile: Profile = profiles[profileKey]

    const result: Result = command.result

    let finalize: boolean = true

    try {
      const out = (text: string, error: boolean = false): void => {
        if (command.aborted || command.complete) {
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
      const finish = (code: number): void => {
        if (command.aborted || command.complete) {
          return
        }

        result.code = code

        command.complete = true
        command.error = result.code !== 0
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
      result.code = 1
    }

    if (finalize) {
      command.complete = true
      command.error = result.code !== 0
    }

    return command
  })

  ipcMain.handle('runtimes', async (): Promise<RuntimeModel[]> => {
    return runtimeList()
  })

  ipcMain.handle('runtimeTarget', async (): Promise<number> => {
    return workspace.runtimeIndex
  })
}
