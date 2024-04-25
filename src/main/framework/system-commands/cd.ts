import { ExecuteContext } from '../runtime'

export default {
  command: ':test',
  async task(context: ExecuteContext): Promise<void> {
    return new Promise((resolve) => {
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          context.out(`cmd @ ${i}\n`)
          if (i == 9) {
            resolve()
          }
        }, i * 1000)
      }
    })
  }
}
