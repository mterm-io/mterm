import { MTermWindow } from '../window'

export class PlatformWindow extends MTermWindow {
  onLoad(): void {
    console.log('HELLO')
  }
}
