import { app } from 'electron'

async function restart(): Promise<void> {
  app.relaunch()
  app.exit()
}

export default {
  command: ':restart',
  task: restart
}
