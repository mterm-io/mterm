import { pathExists, readJSON, writeFile, writeJson } from 'fs-extra'
import { Command } from './runtime'

export interface HistoricalExecution {
  prompt: string
  result?: string[]
  error: boolean
  aborted: boolean
  profile: string
  when: {
    start: number
    finish: number
  }
  code: number
}

export class History {
  public execution: HistoricalExecution[] = []

  constructor(public location: string) {}

  async load(): Promise<void> {
    const isExist = await pathExists(this.location)
    if (!isExist) {
      const prettyJSON = JSON.stringify([], null, 2)

      await writeFile(this.location, prettyJSON, 'utf-8')
    } else {
      this.execution = await readJSON(this.location)
    }
  }
  append(command: Command, start: number, profile: string, saveResult: boolean, max: number): void {
    if (this.execution.length + 1 > max) {
      this.execution.shift()
    }

    this.execution.push({
      prompt: command.prompt,
      aborted: command.aborted,
      result: saveResult ? command.result.stream.map((o) => o.raw) : undefined,
      error: command.error,
      profile,
      when: {
        start,
        finish: Date.now()
      },
      code: command.result.code
    })
  }

  async write(): Promise<void> {
    await writeFile(this.location, JSON.stringify(this.execution, null, 2))
  }
}
