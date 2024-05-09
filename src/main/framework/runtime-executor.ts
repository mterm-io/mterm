import { spawn } from 'node:child_process'

import { ExecuteContext } from './execute-context'

import Reload from './system-commands/reload'
import Exit from './system-commands/exit'
import History from './system-commands/history'
import Cd from './system-commands/cd'
import Tab from './system-commands/tab'
import Test from './system-commands/test'
import Clear from './system-commands/clear'
import Version from './system-commands/version'
import Vault from './system-commands/vault'
import Workspace from './system-commands/workspace'
import Settings from './system-commands/settings'
import Edit from './system-commands/edit'
import Reset from './system-commands/reset'
import Commands from './system-commands/commands'

const systemCommands: Array<{
  command: string
  alias?: string[]
  task: (context: ExecuteContext, ...args: string[]) => Promise<void> | void
}> = [
  Reload,
  Exit,
  History,
  Cd,
  Tab,
  Test,
  Clear,
  Version,
  Vault,
  Workspace,
  Settings,
  Edit,
  Reset,
  Commands
]
export async function execute(context: ExecuteContext): Promise<void | boolean> {
  const [cmd, ...args] = context.command.prompt.split(' ')

  // check for system commands
  for (const systemCommand of systemCommands) {
    if (systemCommand.command === cmd || systemCommand?.alias?.includes(cmd)) {
      return systemCommand.task(context, ...args)
    }
  }

  // check for user commands
  if (context.workspace.commands.has(cmd)) {
    let result = await Promise.resolve(context.workspace.commands.run(context, cmd, ...args))

    if (!result) {
      // nothing was replied with, assume this is a run that will happen in time
      return false
    }

    if (typeof result === 'object') {
      result = JSON.stringify(result, null, 2)
    }

    context.out(`${result}`)
    return
  }

  // finally send to the system
  const [platformProgram, ...platformProgramArgs] = context.platform.split(' ')

  const argsClean = platformProgramArgs.map(
    (arg: string) => `${arg.replace('$ARGS', context.command.prompt)}`
  )

  const childSpawn = spawn(platformProgram, argsClean, {
    cwd: context.runtime.folder,
    env: process.env
  })

  childSpawn.stdout.on('data', (data) => context.out(data))
  childSpawn.stderr.on('data', (data) => context.out(data, true))

  return new Promise((resolve) => {
    childSpawn.on('exit', (code) => {
      context.finish(code || 0)

      resolve()
    })
  })
}
