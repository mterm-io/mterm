import { ExecuteContext } from '../execute-context'

async function reset(context: ExecuteContext): Promise<boolean> {
  context.out('Oh lawd')

  const okay = context.ui(`
    <h1>Hello</h1>
  `)

  setTimeout(() => {
    okay.update(`
      <h1>Goodbye</h1>
    `)
  })

  return false
}

export default {
  command: ':reset',
  alias: ['reset'],
  task: reset
}
