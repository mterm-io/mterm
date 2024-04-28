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
  complete: boolean
  runtime: string
  error: boolean
  id: string
}
export interface Runtime {
  id: string
  result: Result
  prompt: string
  target: boolean
  profile: string
  folder: string
  appearance: {
    title: string
    icon: string
  }
  history: Command[]
}
