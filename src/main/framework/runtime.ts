import { resolveFolderPathForMTERM } from './workspace'
import short from 'short-uuid'
import { ChildProcessWithoutNullStreams } from 'node:child_process'
import { resolve } from 'path'
import { ResultStream } from './result-stream'
import { ExecuteContext } from './execute-context'

export interface Result {
  code: number
  stream: ResultStream[]
  edit?: EditFile
}
export interface ResultContentEvent {
  event: string

  runtimeId: string
  commandId: string
  contextId: string
  contentId: string
  handlerId: string
}
export interface ResultViewModel {
  code: number
  stream: ResultStream[]
  edit?: EditFileViewModel
  events: ResultContentEvent[]
}

export interface ResultStreamEvent {
  runtime: string
  command: string
  entry: ResultStream
}

export interface EditFileViewModel {
  path: string
  modified: boolean
  content: string
}

export class Prompt {
  private _value: string = ''
  public parts: string[] = []
  public args: string[] = []
  public cmd: string = ''
  constructor(value: string = '') {
    this.value = value
  }

  set value(value: string) {
    this._value = value
    this.parts = value
      .split('\n')
      .map((line) => line.trim())
      .join(' ')
      .split(' ')

    const [cmd, ...args] = this.parts

    this.cmd = cmd
    this.args = args
  }

  get value(): string {
    return this._value
  }
}

export interface EditFile extends EditFileViewModel {
  callback: (text: string) => Promise<void> | void
}
export interface Command {
  prompt: string
  result: Result
  runtime: string
  complete: boolean
  aborted: boolean
  error: boolean
  id: string
  process?: ChildProcessWithoutNullStreams
  context?: ExecuteContext
}

export interface CommandViewModel {
  prompt: string
  result: ResultViewModel
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
  result: ResultViewModel
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
