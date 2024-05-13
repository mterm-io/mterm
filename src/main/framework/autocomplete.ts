import { Workspace } from './workspace'
import { readdir } from 'fs-extra'
import { join, parse } from 'path'

export interface HostProgram {
  path: string
  ext: string
  name: string
  base: string
}
export class Autocomplete {
  private programList: HostProgram[] = []
  private solving: boolean = false
  constructor(private workspace: Workspace) {}

  async complete() {}

  async solveFolder(pathFolder: string, extensions: string[]): Promise<void> {
    try {
      const fileList = await readdir(pathFolder)

      const matchingFiles = fileList.filter(
        (file) =>
          extensions.find((fileExt) => file.toLowerCase().endsWith(fileExt.toLowerCase())) !==
          undefined
      )

      matchingFiles.forEach((file) => {
        const path = join(pathFolder, file)
        const { name, ext, base } = parse(file)

        this.programList.push({
          path,
          ext,
          name,
          base
        })
      })
    } catch (e) {
      // console.error(e)
      // ignore, likely a bad folder (inaccessible, or invalid path)
    }
  }
  async solve(): Promise<void> {
    if (this.solving) {
      return
    }

    const start = Date.now()

    this.programList = []
    this.solving = true

    const programExt = process.env.PATHEXT || ''
    const programPath = process.env.PATH || ''

    const pathFolderList = programPath.split(';')
    const programExtList = programExt.split(';')

    const solution = pathFolderList.map((pathFolder) =>
      this.solveFolder(pathFolder, programExtList)
    )

    await Promise.all(solution)

    this.solving = false

    const finish = Date.now() - start

    console.log(`found ${this.programList.length} programs from path, in ${finish}ms`)
  }
}
