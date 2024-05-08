import { ExecuteContext } from '../execute-context'

async function reset(context: ExecuteContext): Promise<boolean> {
  context.out('Time: ')

  let minute = 0
  let second = 0

  const M = context.content(`<span>00</span>`)

  context.out(':')

  const S = context.content(`<span>00</span>`)

  setInterval(() => {
    S.update(`<span>${`${second++}`.padStart(2, '0')}</span>`)
  }, 1000)
  setInterval(() => {
    M.update(`<span>${`${minute++}`.padStart(2, '0')}</span>`)
  }, 1000 * 60)

  M.on('click', () => {
    second = 0
  })

  return false
}

export default {
  command: ':reset',
  alias: ['reset'],
  task: reset
}
