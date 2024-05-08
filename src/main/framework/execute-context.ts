import { Workspace } from './workspace'
import { Command, ResultStream, ResultStreamEvent, Runtime, RuntimeHTMLHandle } from './runtime'
import { WebContents } from 'electron'
import createDOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'
import Convert from 'ansi-to-html'
import { readFile } from 'fs-extra'

const convert = new Convert()
const DOMPurify = createDOMPurify(new JSDOM('').window)

export class ExecuteContext {
  public start: number = Date.now()
  constructor(
    public readonly platform: string,
    public readonly sender: WebContents,
    public readonly workspace: Workspace,
    public readonly runtime: Runtime,
    public readonly command: Command,
    public readonly profile: string,
    public readonly history: {
      enabled: boolean
      results: boolean
      max: number
    }
  ) {}

  out(text: string, error: boolean = false): void {
    const isFinished = this.command.aborted || this.command.complete
    if (isFinished) {
      if (!this.command.result.edit) {
        return
      }
    }
    const raw = text.toString()

    text = DOMPurify.sanitize(raw)
    text = convert.toHtml(text)

    const streamEntry: ResultStream = {
      text,
      error,
      raw
    }

    this.command.result.stream.push(streamEntry)

    const streamEvent: ResultStreamEvent = {
      entry: streamEntry,
      runtime: this.runtime.id,
      command: this.command.id
    }

    if (!this.sender.isDestroyed()) {
      this.sender.send('runtime.commandEvent', streamEvent)
    }
  }

  ui(html: string): RuntimeHTMLHandle {
    this.out(html, false)
    return {
      update(newHTML: string): void {
        console.log('NEW HTML', newHTML)
      }
    }
  }

  async edit(path: string, callback: (text: string) => void): Promise<void> {
    const file = await readFile(path)

    this.command.result.edit = {
      path,
      modified: false,
      content: file.toString(),
      callback
    }

    this.sender.send('runtime.commandEvent')
  }

  finish(code: number): void {
    console.log(this.command)
    if (this.command.aborted || this.command.complete) {
      return
    }

    this.command.result.code = code
    this.command.complete = true
    this.command.error = this.command.result.code !== 0

    if (this.history.enabled) {
      this.workspace.history.append(this.command, this.start, this.profile, this.history.results)
    }
  }
}
