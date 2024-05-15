import { transformer } from './index'
export const echo: transformer = (_, ...args) => {
  return `echo "${args.join(':')}"`
}
