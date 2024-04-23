import { resolveFolderPathForMTERM } from './workspace'
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
export interface RuntimeModel {
  id: string
  prompt: string
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
