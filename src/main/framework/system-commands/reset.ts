import { ExecuteContext } from '../execute-context'

async function reset(context: ExecuteContext): Promise<boolean> {
  context.out('Oh lawd')

  const okay = context.content(`
    <h1>Hello</h1>
  `)

  setTimeout(() => {
    okay.update(`
      <h1>Goodbye</h1>
    `)
  }, 5000)

  return false
}

export default {
  command: ':reset',
  alias: ['reset'],
  task: reset
}
