import { transformer } from './index'
export const split: transformer = (_, value, index = '0', deliminator = ',') => {
  const args = value.split(deliminator)
  const indexNumber = parseInt(index, 10)

  console.log(value, indexNumber, deliminator)
  return args[indexNumber]
}
