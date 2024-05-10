import { transformer } from './index'
import { ExecuteContext } from '../execute-context'

function find(context: ExecuteContext, key: string): string | undefined {
  if (context.workspace.store.unlocked) {
    // is vault unlocked?
    // search here first!
    const valueMaybe = context.workspace.store.value<string>(key)
    if (valueMaybe !== undefined && valueMaybe !== null) {
      // value entries can be empty strings
      // lets not do a simple falsie here
      return valueMaybe
    }
  }
  const valueMaybe = process.env[key]
  if (valueMaybe !== undefined) {
    return valueMaybe
  }

  return undefined
}
export const get: transformer = (context, keyList, fallback = '') => {
  const keys = keyList.split(',')

  for (const key of keys) {
    const valueMaybe = find(context, key)
    if (valueMaybe !== undefined) {
      return valueMaybe
    }
  }

  return fallback
}
