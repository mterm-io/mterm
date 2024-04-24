import { Command, Runtime } from './runtime'
import { resolveFolderPathForMTERM, Workspace } from './workspace'
import { RunnerWindow } from '../window/windows/runner'
import { app } from 'electron'
import { spawn } from 'node:child_process'
import { resolve } from 'path'
import { pathExists } from 'fs-extra'

export async function execute(
  platform: string,
  workspace: Workspace,
  runtime: Runtime,
  command: Command,
  out: (text: string, error?: boolean) => void,
  finish: (code: number) => void
): Promise<void | boolean> {
  const [cmd, ...args] = command.prompt.split(' ')

  // check for system commands
  switch (cmd) {
    case ':reload':
      await workspace.load()
      await workspace.reload(RunnerWindow)

      out(['- settings reloaded', '- theme reloaded', '- term reloaded'].join('\n'))

      return
    case ':exit':
      if (!workspace.removeRuntime(runtime)) {
        app.quit()
      }

      out('..')

      return

    case ':tab':
      workspace.addRuntime()
      workspace.runtimeIndex = workspace.runtimes.length - 1

      out('->')

      return

    case ':history':
      out(JSON.stringify(runtime.history, null, 2))

      return

    case ':test':
      return new Promise((resolve) => {
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            out(`cmd @ ${i}\n`)
            if (i == 9) {
              resolve()
            }
          }, i * 1000)
        }
      })

    case 'cd': {
      const path: string = args[0] || '.'

      let location = resolve(runtime.folder, path)
      if (path.startsWith('~')) {
        location = resolveFolderPathForMTERM(path)
      }

      const isLocationActive = await pathExists(location)

      if (!isLocationActive) {
        out(`Folder not found \n\n${location}`, true)
        finish(1)
        return
      }

      runtime.folder = location

      return
    }
  }

  if (workspace.commands.lib[cmd]) {
    const exec = workspace.commands.lib[cmd]

    const result = await Promise.resolve(exec(...args))

    if (!result) {
      // nothing was replied with, assume this is a run that will happen in time
      return false
    }

    out(`${result}`)
    return
  }

  const [platformProgram, ...platformProgramArgs] = platform.split(' ')

  const argsClean = platformProgramArgs.map(
    (arg: string) => `${arg.replace('$ARGS', command.prompt)}`
  )

  // ptyProcess.console.log(platformProgram, argsClean)
  //
  const childSpawn = spawn(platformProgram, argsClean, {
    cwd: runtime.folder
  })

  childSpawn.stdout.on('data', (data) => out(data))
  childSpawn.stderr.on('data', (data) => out(data, true))

  return new Promise((resolve) => {
    childSpawn.on('exit', (code) => {
      finish(code || 0)

      resolve()
    })
  })
}
