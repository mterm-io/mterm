export interface Command {
  result: string
  prompt: string
  runtime: string
  id: string
}
export interface Runtime {
  id: string
  result: string
  prompt: string
  target: boolean
  folder: string
  appearance: {
    title: string
    icon: string
  }
  history: Command[]
}
