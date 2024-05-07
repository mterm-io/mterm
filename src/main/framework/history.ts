import { pathExists, readJSON, writeFile } from 'fs-extra'
import { Command } from './runtime'

export interface HistoricalExecution {
  prompt: string
  result?: string[]
  error: boolean
  aborted: boolean
  profile: string
  edit?: string
  when: {
    start: number
    finish: number
  }
  code: number
}

// so why save two seperate histories?
// new execution is the history that is still pending writing
// this gives us the ability to easily scroll without exposing all the data to the front all at once
export class History {
  public priorExecution: HistoricalExecution[] = []
  public newExecution: HistoricalExecution[] = []
  public scrollIndex: number = 0
  constructor(public location: string) {}

  async load(): Promise<void> {
    const isExist = await pathExists(this.location)
    if (!isExist) {
      const prettyJSON = JSON.stringify([], null, 2)

      await writeFile(this.location, prettyJSON, 'utf-8')
    } else {
      this.priorExecution = await readJSON(this.location)
    }
  }
  append(command: Command, start: number, profile: string, saveResult: boolean): void {
    this.newExecution.push({
      prompt: command.prompt,
      aborted: command.aborted,
      result: saveResult ? command.result.stream.map((o) => o.raw) : undefined,
      error: command.error,
      profile,
      edit: command?.edit?.path,
      when: {
        start,
        finish: Date.now()
      },
      code: command.result.code
    })
  }

  async write(max: number): Promise<void> {
    const history: Array<HistoricalExecution> = [...this.priorExecution, ...this.newExecution]

    history.sort((historyA, historyB) => historyA.when.start - historyB.when.start)

    const historyFinalList =
      max < history.length ? history.slice(history.length - max, history.length) : history

    await writeFile(this.location, JSON.stringify(historyFinalList, null, 2))
  }

  rewind(): HistoricalExecution | undefined {
    if (this.scrollIndex >= this.priorExecution.length) {
      return
    }
    const historicalItem = this.priorExecution[this.priorExecution.length - 1 - this.scrollIndex]

    this.scrollIndex++

    return historicalItem
  }
}
