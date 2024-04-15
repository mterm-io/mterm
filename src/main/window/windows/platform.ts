import { MTermWindow } from '../mterm-window'

export class PlatformWindow extends MTermWindow {
  onLoad(): void {
    console.log('HELLO')
  }
}
