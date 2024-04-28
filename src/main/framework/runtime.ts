import { resolveFolderPathForMTERM, Workspace } from './workspace'
import short from 'short-uuid'
import { ChildProcessWithoutNullStreams } from 'node:child_process'

export interface ResultStream {
  error: boolean
  text: string
  raw: string
}

export interface Result {
  code: number
  stream: ResultStream[]
}

export interface ResultStreamEvent {
  runtime: string
  command: string
  entry: ResultStream
}
export interface Command {
  prompt: string
  result: Result
  runtime: string
  complete: boolean
  error: boolean
  id: string
  process?: ChildProcessWithoutNullStreams
}

export interface CommandViewModel {
  prompt: string
  result: Result
  runtime: string
  complete: boolean
  error: boolean
  id: string
}

export interface Profile {
  platform: string
  theme: string
  icon: string
}

export interface ProfileViewModel extends Profile {
  key: string
}

export type ProfileMap = Record<string, Profile>
export interface RuntimeModel {
  id: string
  prompt: string
  profile: string
  result: Result
  target: boolean
  folder: string
  history: CommandViewModel[]
  commandFocus: string
  appearance: {
    icon: string
    title: string
  }
}
export class Runtime {
  constructor(public folder: string) {
    this.folder = resolveFolderPathForMTERM(folder)
  }
  public profile: string = 'default'
  public id: string = short.generate()
  public history: Command[] = []
  public prompt: string = ''
  public commandFocus: string = ''
  public appearance: {
    icon: string
    title: string
  } = {
    icon: '',
    title: 'mterm [$idx]'
  }
}

export interface ExecuteContext {
  platform: string
  workspace: Workspace
  runtime: Runtime
  command: Command
  out: (text: string, error?: boolean) => void
  finish: (code: number) => void
}
