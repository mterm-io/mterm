export interface Command {
  result: string
  prompt: string
  id: string
}
export interface Runtime {
  prompt: string
  target: boolean
  folder: string
  appearance: {
    title: string
    icon: string
  }
  history: Command[]
}
