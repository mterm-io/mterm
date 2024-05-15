import { snakeCase } from 'lodash'
import { transformer } from './index'

export const snake: transformer = (_, text) => snakeCase(text)
