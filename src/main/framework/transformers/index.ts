import { ExecuteContext } from '../execute-context'

import { get } from './get'
import { split } from './split'
import { run } from './run'
import { echo } from './echo'

export const TRANSFORMER_REGEX = /:(\w+)(?:\(([^()]*(?:\([^()]*\)[^()]*)*)\))?/g
export const TRANSFORMERS = {
  get,
  split,
  run,
  echo
}

export type transformer = (context: ExecuteContext, ...args: string[]) => Promise<string> | string

export async function process(context: ExecuteContext, input: string): Promise<string> {
  let result = input
  let match: RegExpMatchArray | null

  while ((match = TRANSFORMER_REGEX.exec(result))) {
    const operation = match[1]
    const argString = match[2] || ''

    match.index = match.index || 0

    // Check if the operation exists in the transformerMap
    if (operation in TRANSFORMERS) {
      // Process the arguments recursively
      const processedArgString = await process(context, argString)

      // Split the processed argument string into individual arguments
      const args = splitArgs(processedArgString)

      // Resolve nested transformers
      const resolvedArgs = await Promise.all(
        args.map(async (arg) => {
          if (TRANSFORMER_REGEX.test(arg)) {
            const R = await process(context, arg)
            console.log(R, 'RUN ME')
            return R
          }
          return arg
        })
      )

      // Call the corresponding transformer function with the resolved arguments
      const transformerFn = TRANSFORMERS[operation]
      let replacementString = ''

      if (resolvedArgs.length === 0) {
        replacementString = await transformerFn(context)
      } else if (resolvedArgs.length === 1) {
        replacementString = await transformerFn(context, resolvedArgs[0])
      } else if (resolvedArgs.length === 2) {
        replacementString = await transformerFn(context, resolvedArgs[0], resolvedArgs[1])
      } else if (resolvedArgs.length === 3) {
        replacementString = await transformerFn(
          context,
          resolvedArgs[0],
          resolvedArgs[1],
          resolvedArgs[2]
        )
      } else {
        // Handle cases with more than 3 arguments if needed
        // ...
      }

      if (replacementString === undefined) {
        // Handle the case when the transformer function returns undefined
        replacementString = ''
      }

      result =
        result.slice(0, match.index) +
        replacementString +
        result.slice(match.index + match[0].length)
      TRANSFORMER_REGEX.lastIndex = match.index + replacementString.length
    } else {
      // If the operation doesn't exist in the transformerMap, keep the original substring
      const originalSubstring = `:${operation}${argString ? `(${argString})` : ''}`
      result =
        result.slice(0, match.index) +
        originalSubstring +
        result.slice(match.index + match[0].length)
      TRANSFORMER_REGEX.lastIndex = match.index + originalSubstring.length
    }
  }

  return result
}

function splitArgs(argString: string): string[] {
  const args: string[] = []
  let currentArg = ''
  let nestedLevel = 0
  let transformerPrefix = ''

  for (let i = 0; i < argString.length; i++) {
    const char = argString[i]

    if (char === '(') {
      nestedLevel++
      currentArg += transformerPrefix + char
      transformerPrefix = ''
    } else if (char === ')') {
      nestedLevel--
      currentArg += char
    } else if (char === ':' && nestedLevel === 0) {
      if (transformerPrefix === ':') {
        args.push(currentArg)
        currentArg = ''
        transformerPrefix = ''
      } else {
        transformerPrefix = ':'
      }
    } else {
      currentArg += transformerPrefix + char
      transformerPrefix = ''
    }
  }

  if (currentArg !== '') {
    args.push(currentArg)
  }

  return args
}

export async function transform(context: ExecuteContext): Promise<string> {
  return await process(context, context.command.prompt)
}
