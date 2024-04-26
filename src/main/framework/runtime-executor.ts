import { ExecuteContext } from './runtime'
import { spawn } from 'node:child_process'

import Reload from './system-commands/reload'
import Exit from './system-commands/exit'
import History from './system-commands/history'
import Cd from './system-commands/cd'
import Tab from './system-commands/tab'
import Test from './system-commands/test'
import Clear from './system-commands/clear'
import cls from './system-commands/cls'

const systemCommands = [Reload, Exit, History, Cd, Tab, Test, Clear, cls]

export async function execute(context: ExecuteContext): Promise<void | boolean> {
  const { platform, workspace, runtime, command, out, finish } = context
  const [cmd, ...args] = command.prompt.split(' ')

  // check for system commands
  for (const systemCommand of systemCommands) {
    if (systemCommand.command === cmd) {
      await systemCommand.task(context)

      return
    }
  }

  // check for user commands
  if (workspace.commands.has(cmd)) {
    const result = await Promise.resolve(workspace.commands.run(context, cmd, ...args))

    if (!result) {
      // nothing was replied with, assume this is a run that will happen in time
      return false
    }

    out(`${result}`)
    return
  }

  // finally send to the system
  const [platformProgram, ...platformProgramArgs] = platform.split(' ')

  const argsClean = platformProgramArgs.map(
    (arg: string) => `${arg.replace('$ARGS', command.prompt)}`
  )

  const childSpawn = spawn(platformProgram, argsClean, {
    cwd: runtime.folder,
    env: process.env
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
