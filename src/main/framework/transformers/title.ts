import { startCase, toLower } from 'lodash'
import { transformer } from './index'
export const title: transformer = (_, text) => startCase(toLower(text))
