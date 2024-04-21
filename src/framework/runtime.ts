import { resolveFolderPathForMTERM } from './workspace'
import short from 'short-uuid'

export interface ResultStream {
  error: boolean
  text: string
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
  error: boolean
  id: string
}
export interface RuntimeModel {
  id: string
  prompt: string
  result: Result
  target: boolean
  folder: string
  history: Command[]
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
