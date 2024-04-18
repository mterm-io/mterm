import { resolveFolderPathForMTERM } from './workspace'

export interface Command {
  prompt: string
}
export interface RuntimeModel {
  prompt: string
  target: boolean
  folder: string
  appearance: {
    icon: string
    title: string
  }
}
export class Runtime {
  constructor(public folder: string) {
    this.folder = resolveFolderPathForMTERM(folder)
  }
  public prompt: string = ''
  public appearance: {
    icon: string
    title: string
  } = {
    icon: '',
    title: 'mterm [$idx]'
  }
}
