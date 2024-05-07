import { resolveFolderPathForMTERM, Workspace } from './workspace'
import short from 'short-uuid'
import { ChildProcessWithoutNullStreams } from 'node:child_process'
import { resolve } from 'path'

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

export interface EditFile {
  path: string
  modified: boolean
  content: string
}
export interface Command {
  prompt: string
  result: Result
  edit: EditFile
  runtime: string
  complete: boolean
  aborted: boolean
  error: boolean
  id: string
  process?: ChildProcessWithoutNullStreams
}

export interface CommandViewModel {
  prompt: string
  result: Result
  edit: EditFile
  runtime: string
  aborted: boolean
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
  public resultEdit: string = ''
  public appearance: {
    icon: string
    title: string
  } = {
    icon: '',
    title: 'mterm [$idx]'
  }

  resolve(path: string): string {
    let location = resolve(this.folder, path)
    if (path.startsWith('~')) {
      location = resolveFolderPathForMTERM(path)
    }

    return location
  }
}

export interface ExecuteContext {
  platform: string
  workspace: Workspace
  runtime: Runtime
  command: Command
  edit: (path: string, callback: (content: string) => void) => void
  out: (text: string, error?: boolean) => void
  finish: (code: number) => void
}
