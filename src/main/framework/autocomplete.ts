import { Workspace } from './workspace'
import { readdir } from 'fs-extra'
import { isAbsolute, join, parse } from 'path'
import { Runtime } from './runtime'
import { HistoricalExecution } from './history'
import { SystemCommand, systemCommands } from './runtime-executor'

export interface PathParts {
  path: string
  ext: string
  name: string
  base: string
}

export enum SuggestionEntryType {
  HISTORY,
  PATH,
  PROGRAM,
  COMMAND_SYSTEM,
  COMMAND_USER
}
export interface SuggestionEntry {
  type: SuggestionEntryType
  prompt: string
  parts: PathParts
  cursor: number
}
export interface Suggestion {
  list: SuggestionEntry[]
}
export function suggestion(
  type: SuggestionEntryType,
  prompt: string,
  parts: PathParts
): SuggestionEntry {
  return {
    type,
    prompt,
    parts,
    cursor: -1 // end of line
  }
}

export function toParts(path: string): PathParts {
  const args = splitArgs(path)

  const program = args[0]

  const { name, ext, base } = parse(removeQuotesIfSurrounded(program))

  return {
    path,
    name,
    ext,
    base
  }
}
export function historyToSuggestion(history: HistoricalExecution): SuggestionEntry {
  return suggestion(SuggestionEntryType.HISTORY, history.prompt, toParts(history.prompt))
}

export function partsToSuggestion(parts: PathParts): SuggestionEntry {
  return suggestion(SuggestionEntryType.PROGRAM, parts.name, parts)
}

export function systemsCommandToSuggestion(command: SystemCommand): SuggestionEntry {
  return suggestion(SuggestionEntryType.COMMAND_SYSTEM, command.command, toParts(command.command))
}

export function userCommandToSuggestion(command: string): SuggestionEntry {
  return suggestion(SuggestionEntryType.COMMAND_USER, command, toParts(command))
}

function removeQuotesIfSurrounded(input: string): string {
  if (input.length >= 2 && input.startsWith('"') && input.endsWith('"')) {
    return input.slice(1, -1)
  }
  return input
}

// expand path matches
async function getPathMatches(
  cursor: number,
  args: string[],
  focusedBlock: number,
  runtime: Runtime
): Promise<SuggestionEntry[]> {
  const argToExpand = args[focusedBlock]
  const { dir, base } = parse(argToExpand)

  function toSuggestionList(matches: string[]): SuggestionEntry[] {
    return matches.map((pathMatch) => {
      const argNew = [...args]
      argNew[focusedBlock] = pathMatch

      const { ext, name } = parse(pathMatch)
      const prompt = argNew.join(' ')

      // Find all occurrences of pathMatch in the prompt
      const occurrences: number[] = []
      let index = prompt.indexOf(pathMatch)
      while (index !== -1) {
        occurrences.push(index)
        index = prompt.indexOf(pathMatch, index + 1)
      }

      // Find the occurrence nearest to the provided cursor
      let computedCursor = prompt.length
      for (const occurrence of occurrences) {
        if (Math.abs(occurrence - cursor) < Math.abs(computedCursor - cursor)) {
          computedCursor = occurrence + pathMatch.length
        }
      }

      return {
        type: SuggestionEntryType.PATH,
        prompt,
        cursor: computedCursor,
        duplicate: false,
        parts: {
          ext,
          name,
          base,
          path: pathMatch
        }
      }
    })
  }

  const directoryToScan = isAbsolute(argToExpand) ? dir : join(runtime.folder, dir)

  // travel up the file tree
  try {
    const paths = await readdir(directoryToScan)

    const matches =
      paths
        ?.filter((child) => child.startsWith(base))
        ?.map((child) => {
          let prefix = ''
          if (prefix === '' || prefix === '.') {
            prefix = './'
          }
          return prefix + join(dir, child).replaceAll('\\', '/')
        }) || []

    return toSuggestionList(matches)
  } catch (e) {
    // user provided a bogus path maybe, or not readable
    return []
  }
}
/**
 * Determines the index of the block where the cursor is located within the input string.
 *
 * @param {string} input - The input string to be analyzed.
 * @param {number} cursor - The position of the cursor within the input string.
 * @returns {number} The index of the block where the cursor is located.
 *
 * @description
 * This function takes an input string and a cursor position as parameters and returns the index
 * of the block where the cursor is located. The input string is split into blocks based on spaces,
 * but spaces within quoted strings are preserved as part of the block.
 *
 * The function uses a regular expression to match and identify the blocks within the input string.
 * It iterates over each matched block and checks if the cursor position falls within the start and
 * end positions of the block. If the cursor is found within a block, the function returns the index
 * of that block.
 *
 * If the cursor position is at the end of the input string, the function considers it to be within
 * the last block and returns the index of the last block.
 *
 * If the cursor position is not found within any block, the function returns -1.
 *
 * @example
 * // Returns 0
 * getCursorBlock('"C:/Program filx" node --v', 15);
 *
 * @example
 * // Returns 0
 * getCursorBlock('"C:/Programx file" node --v', 11);
 *
 * @example
 * // Returns 0
 * getCursorBlock('"Cx:/Program fil" node --v', 2);
 *
 * @example
 * // Returns 1
 * getCursorBlock('"C:/Program files" nodex --v', 22);
 *
 * @example
 * // Returns 2
 * getCursorBlock('"C:/Program filx" node --vx', 26);
 */
function getCursorBlock(input: string, cursor: number): number {
  const regex = /[^\s"]+|"([^"]*)"/gi
  let match: RegExpExecArray | null
  let blockIndex = 0

  while ((match = regex.exec(input)) !== null) {
    const blockStart = match.index
    const blockEnd = blockStart + match[0].length

    if (cursor >= blockStart && cursor <= blockEnd) {
      return blockIndex
    }

    blockIndex++
  }

  // If the cursor is at the end of the input string
  if (cursor === input.length) {
    return blockIndex - 1
  }

  return -1 // Cursor position not found within any block
}

/**
 * Splits a string into an array of substrings based on spaces, preserving spaces within quoted strings.
 *
 * @param {string} input - The input string to be split.
 * @returns {string[]} An array of substrings split from the input string.
 *
 * @description
 * This function takes an input string and splits it into an array of substrings based on spaces.
 * However, it treats spaces within quoted strings as part of the substring and preserves them.
 *
 * The function uses a regular expression to match and identify the substrings within the input string.
 * The regular expression has two parts:
 * - `[^\s"]+`: Matches one or more characters that are not whitespace or double quotes.
 * - `"([^"]*)"`: Matches a double-quoted string (excluding the quotes themselves).
 *
 * The function iterates over the input string using the `regex.exec()` method to find all the matches.
 * For each match, it checks if the captured group (the content within quotes) exists. If it does, the
 * function pushes the captured group surrounded by quotes to the `matches` array. Otherwise, it pushes
 * the entire matched substring.
 *
 * After processing all the matches, the function returns the `matches` array containing the split substrings.
 *
 * @example
 * const input = '"C:/Program files" node --v';
 * const result = splitArgs(input);
 * console.log(result);
 * // Output: [""C:/Program files"", "node", "--v"]
 *
 * @example
 * const input = 'git commit -m "Initial commit"';
 * const result = splitArgs(input);
 * console.log(result);
 * // Output: ["git", "commit", "-m", ""Initial commit""]
 *
 * @example
 * const input = 'echo "Hello, world!" | grep "Hello"';
 * const result = splitArgs(input);
 * console.log(result);
 * // Output: ["echo", ""Hello, world!"", "|", "grep", ""Hello""]
 */
function splitArgs(input: string): string[] {
  const regex = /[^\s"]+|"([^"]*)"/gi
  const matches: string[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(input)) !== null) {
    matches.push(match[1] ? `"${match[1]}"` : match[0])
  }

  return matches
}

export class Autocomplete {
  private programList: PathParts[] = []
  private solving: boolean = false
  constructor(private workspace: Workspace) {}

  async complete(prompt: string, cursor: number, runtime: Runtime): Promise<Suggestion> {
    if (prompt.trim().length === 0) {
      return {
        list: []
      }
    }
    const historyMatches = this.workspace.history.priorExecution.filter((history) =>
      history.prompt.startsWith(prompt)
    )

    historyMatches.push(
      ...this.workspace.history.newExecution.filter((history) => history.prompt.startsWith(prompt))
    )

    const systemCommandMatches = systemCommands.filter(
      (o) => o.command.startsWith(prompt) || o.alias?.find((o) => o.startsWith(prompt))
    )

    const userCommandMatches = Object.keys(this.workspace.commands.lib).filter((o) =>
      o.startsWith(prompt)
    )

    const programMatches = this.programList.filter(
      (program) => program.name.startsWith(prompt) || program.path.startsWith(prompt)
    )

    const args = splitArgs(prompt)

    // this is the part of the prompt that user has the focus on right now
    const focusedBlock = getCursorBlock(prompt, cursor)

    const pathMatches = await getPathMatches(cursor, args, focusedBlock, runtime)

    const list: SuggestionEntry[] = []

    const suggestion: Suggestion = {
      list
    }

    function addSuggestion(entry: SuggestionEntry): void {
      const foundExisting = list.find((o) => o.prompt === entry.prompt)
      if (foundExisting || entry.prompt.trim() === runtime.prompt.trim()) {
        // already suggested
        return
      }
      list.push(entry)
    }

    historyMatches.forEach((entry) => addSuggestion(historyToSuggestion(entry)))
    userCommandMatches.forEach((entry) => addSuggestion(userCommandToSuggestion(entry)))
    programMatches.forEach((entry) => addSuggestion(partsToSuggestion(entry)))
    systemCommandMatches.forEach((entry) => addSuggestion(systemsCommandToSuggestion(entry)))
    pathMatches.forEach((entry) => addSuggestion(entry))

    return suggestion
  }

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
