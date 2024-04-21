import { Command, Runtime } from './runtime'
import { Workspace } from './workspace'
import { RunnerWindow } from '../main/window/windows/runner'
import { app } from 'electron'
import { spawn } from 'node:child_process'

export async function execute(
  platform: string,
  workspace: Workspace,
  runtime: Runtime,
  command: Command,
  out: (text: string, error?: boolean) => void,
  finish: (code: number) => void
): Promise<void> {
  // check for system commands
  switch (command.prompt.trim()) {
    case ':reload':
      await workspace.load()
      await workspace.reload(RunnerWindow)

      out(['- settings reloaded', '- theme reloaded', '- term reloaded'].join('<br />'))

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
            out(`cmd @ ${i}`)
            if (i == 9) {
              resolve()
            }
          }, i * 1000)
        }
      })
  }

  const args = command.prompt.split(' ')

  const childSpawn = spawn(platform, args, {})

  childSpawn.stdout.on('data', (data) => out(data))
  childSpawn.stderr.on('data', (data) => out(data, true))

  return new Promise((resolve) => {
    childSpawn.on('close', (code) => {
      finish(code || 0)

      resolve()
    })
  })
}
