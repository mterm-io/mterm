import { resolveFolderPathForMTERM } from './workspace'

export interface Command {
  prompt: string
  result: string
  id: string
}
export interface RuntimeModel {
  prompt: string
  target: boolean
  folder: string
  history: Command[]
  appearance: {
    icon: string
    title: string
  }
}
export class Runtime {
  constructor(public folder: string) {
    this.folder = resolveFolderPathForMTERM(folder)
  }
  public history: Command[] = []
  public prompt: string = ''
  public appearance: {
    icon: string
    title: string
  } = {
    icon: '',
    title: 'mterm [$idx]'
  }
}
