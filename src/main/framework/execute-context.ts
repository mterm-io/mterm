import { Workspace } from './workspace'
import { Command, ResultStreamEvent, Runtime } from './runtime'
import { WebContents } from 'electron'
import { readFile } from 'fs-extra'
import short from 'short-uuid'
import { ResultStream } from './result-stream'

export interface RuntimeContentHandle {
  update(html: string): void
}

export class ExecuteContext {
  public readonly start: number = Date.now()
  public readonly id: string = short.generate()

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

  out(text: string, error: boolean = false): ResultStream | null {
    const isFinished = this.command.aborted || this.command.complete
    if (isFinished) {
      if (!this.command.result.edit) {
        return null
      }
    }
    const streamEntry = new ResultStream(text, error)

    this.command.result.stream.push(streamEntry)

    const streamEvent: ResultStreamEvent = {
      entry: streamEntry,
      runtime: this.runtime.id,
      command: this.command.id
    }

    if (!this.sender.isDestroyed()) {
      this.sender.send('runtime.commandEvent', streamEvent)
    }

    return streamEntry
  }

  content(html: string): RuntimeContentHandle {
    const R = this.out(html, false)
    const sender = this.sender
    return {
      update(newHTML: string): void {
        if (R !== null) {
          R.setText(newHTML)

          sender.send('runtime.commandEvent')
        }
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
