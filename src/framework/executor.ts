import { Command } from './runtime'
import { Workspace } from './workspace'
import { Runtime } from './runtime'
import { RunnerWindow } from '../main/window/windows/runner'

export async function execute(
  workspace: Workspace,
  runtime: Runtime,
  command: Command
): Promise<string> {
  // check for system commands
  switch (command.prompt.trim()) {
    case ':reload':
      await workspace.load()
      await workspace.reload(RunnerWindow)

      return ['- settings reloaded', '- theme reloaded', '- term reloaded'].join('<br />')
    case ':exit':
      break
  }

  return 'ran'
}
