export interface RuntimeModel {
  prompt: string
  target: boolean
  appearance: {
    icon: string
    title: string
  }
}
export class Runtime {
  public prompt: string = ''
  public appearance: {
    icon: string
    title: string
  } = {
    icon: '',
    title: 'mterm [$idx]'
  }
}
