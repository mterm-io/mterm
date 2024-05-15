import { transformer } from './index'
export const upper: transformer = (_, text) => {
  return text.toUpperCase()
}
