import { transformer } from './index'
export const lower: transformer = (_, text) => {
  return text.toLowerCase()
}
