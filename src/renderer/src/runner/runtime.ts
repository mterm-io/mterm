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
export interface Runtime {
  id: string
  result: Result
  prompt: string
  target: boolean
  folder: string
  appearance: {
    title: string
    icon: string
  }
  history: Command[]
}
