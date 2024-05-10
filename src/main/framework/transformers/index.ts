import { ExecuteContext } from '../execute-context'

import { get } from './get'

export const TRANSFORMER_REGEX = /:(\w+)(?:\(([^()]*(?:\([^()]*\)[^()]*)*)\))?/g
export const TRANSFORMERS = {
  get
}

export type transformer = (context: ExecuteContext, ...args: string[]) => Promise<string> | string

async function process(context: ExecuteContext, input: string): Promise<string> {
  let result = input
  let match: RegExpMatchArray | null

  while ((match = TRANSFORMER_REGEX.exec(result))) {
    const operation = match[1]
    const argString = match[2] || ''

    // Process the arguments recursively
    const processedArgString = await process(context, argString)

    // Split the processed argument string into individual arguments
    const args = processedArgString.split(':')

    match.index = match.index || 0

    // Check if the operation exists in the transformerMap
    if (operation in TRANSFORMERS) {
      // Call the corresponding transformer function with the arguments
      const transformerFn = TRANSFORMERS[operation]
      let replacementString = ''

      if (args.length === 1) {
        replacementString = await transformerFn(context, args[0])
      } else if (args.length === 2) {
        replacementString = await transformerFn(context, args[0], args[1])
      } else {
        // Handle cases with more than 2 arguments if needed
        // ...
      }

      result =
        result.slice(0, match.index) +
        replacementString +
        result.slice(match.index + match[0].length)
      TRANSFORMER_REGEX.lastIndex = match.index + replacementString.length
    } else {
      // If the operation doesn't exist in the transformerMap, keep the original substring
      result =
        result.slice(0, match.index) +
        `:${operation}(${processedArgString})` +
        result.slice(match.index + match[0].length)
      TRANSFORMER_REGEX.lastIndex = match.index + `:${operation}(${processedArgString})`.length
    }
  }

  return result
}

export async function transform(context: ExecuteContext): Promise<string> {
  return await process(context, context.command.prompt)
}
