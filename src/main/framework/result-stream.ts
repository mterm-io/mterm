import { sanitizeOutput } from '../util'

export class ResultStream {
  public text: string
  constructor(
    public raw: string,
    public error: boolean = false
  ) {
    this.raw = this.raw.toString()
    this.text = sanitizeOutput(raw)
  }

  setText(raw: string, error: boolean = this.error): void {
    this.raw = raw
    this.text = sanitizeOutput(raw)
    this.error = error
  }
}
