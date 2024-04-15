import { MTermWindow } from '../mterm-window'

const hasStatusText = (value: unknown): value is { statusText: string } => {
  return typeof value === 'object' && value !== null && 'statusText' in value
}
const hasErrorMessage = (value: unknown): value is { message: string } => {
  return typeof value === 'object' && value !== null && 'message' in value
}
export class ErrorModal extends MTermWindow {
  onLoad(): void {
    console.log('HELLO')
  }
  async showError(error: unknown): Promise<void> {
    // const st = await import('stack-trace')
    // const trace = st.get()

    const errorMessage: string = hasStatusText(error)
      ? error.statusText
      : hasErrorMessage(error)
        ? error.message
        : `${error}`

    await this.open(`error?message=${errorMessage}`)
  }
}
