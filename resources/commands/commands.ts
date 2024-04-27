import * as os from 'node:os'
export function hello(name: string = os.userInfo().username): string {
  return `Hi, ${name}`
}

export async function query(): Promise<{
  userId: number
  id: number
  title: string
  completed: boolean
}> {
  const response = await fetch('https://jsonplaceholder.typicode.com/todos/1')

  return await response.json()
}
