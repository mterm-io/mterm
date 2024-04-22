import * as os from 'node:os'
export function hello(name: string = os.userInfo().username): string {
  return `Hi, ${name}`
}
