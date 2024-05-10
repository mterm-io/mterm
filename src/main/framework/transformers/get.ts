import { transformer } from './index'

export const get: transformer = (_, argA, argB) => {
  return `i_got_${argA}_${argB}`
}
