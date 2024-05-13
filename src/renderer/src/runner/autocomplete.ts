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
  prompt?: SuggestionEntry
  list: SuggestionEntry[]
}
