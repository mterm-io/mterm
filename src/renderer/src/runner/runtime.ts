export interface Command {
  result: string
  prompt: string
  id: string
}
export interface Runtime {
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
