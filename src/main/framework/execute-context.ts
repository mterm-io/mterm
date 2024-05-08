import { Workspace } from './workspace'
import { Command, ResultContentEvent, ResultStreamEvent, Runtime } from './runtime'
import { WebContents } from 'electron'
import { readFile } from 'fs-extra'
import short from 'short-uuid'
import { ResultStream } from './result-stream'

export interface RuntimeContentHandle {
  id: string
  update(html: string): void
  on(event: string, handler: RuntimeContentEventCallback): void
}

export interface RuntimeContentEvent {
  event: string
}

export type RuntimeContentEventCallback = (event: RuntimeContentEvent) => Promise<void> | void

export class ExecuteContext {
  public readonly start: number = Date.now()
  public readonly id: string = short.generate()

  public readonly events: ResultContentEvent[] = []
  private readonly eventHandlers = new Map<string, RuntimeContentEventCallback>()

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
    const contextId = this.id
    const runtimeId = this.runtime.id
    const commandId = this.command.id

    const id = short.generate()
    const events = this.events
    const container = (html: string): string => `<span id="${id}">${html}</span>`

    const R = this.out(container(html), false)
    const sender = this.sender
    const eventHandlers = this.eventHandlers
    return {
      id,
      update(newHTML: string): void {
        if (R !== null) {
          R.setText(container(newHTML))

          sender.send('runtime.commandEvent')
        }
      },
      on(event: string, callback: RuntimeContentEventCallback): void {
        const eventHandlerId = short.generate()

        eventHandlers.set(eventHandlerId, callback)

        events.push({
          event,
          commandId,
          contextId,
          runtimeId,
          contentId: id,
          handlerId: eventHandlerId
        })

        sender.send('runtime.observe', {
          contextId,
          contentId: id,
          eventHandlerId,
          event
        })

        sender.send('runtime.commandEvent')
      }
    }
  }

  async fireEvent(eventName: string, handlerId: string): Promise<void> {
    const event = this.eventHandlers.get(handlerId)
    if (!event) {
      return
    }

    await event({
      event: eventName
    })
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
