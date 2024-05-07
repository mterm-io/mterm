import { ExecuteContext } from '../runtime'
import { RunnerWindow } from '../../window/windows/runner'
import { shell } from 'electron'
import { parseInt } from 'lodash'

export default {
  command: ':settings',
  async task(
    context: ExecuteContext,
    task?: string,
    key?: string,
    ...valueBlocks: string[]
  ): Promise<void> {
    let value: string | boolean | number | object = valueBlocks.join(' ')
    if (!task) {
      await context.workspace.showAndHideOthers(RunnerWindow, 'settings/general')
    }
    if (task === 'reload') {
      await context.workspace.settings.load()
      await context.workspace.reload(RunnerWindow)

      context.out(`settings reloaded`)
    } else if (task === 'open') {
      await shell.openPath(context.workspace.settings.location)
    } else if (task === 'edit') {
      await context.edit(context.workspace.settings.location, async () => {
        context.out('Saved settings! Reloading..\n')

        await context.workspace.settings.load()
        await context.workspace.applySettings(RunnerWindow)

        context.out('Settings reloaded\n')
      })
    } else if (task === 'get') {
      if (!key) {
        context.out('no key provided to :settings get', true)
        context.finish(1)
        return
      }
      let value = context.workspace.settings.get(key, 'NOT FOUND')
      if (typeof value === 'object') {
        value = JSON.stringify(value, null, 2)
      }
      context.out(value)
      return
    } else if (task === 'set') {
      if (!key) {
        context.out('no key provided to :settings set', true)
        context.finish(1)
        return
      }
      if (!value) {
        context.out('no value provided to :settings set', true)
        context.finish(1)
        return
      }
      const currentValue = context.workspace.settings.get(key, null)
      if (currentValue !== null && typeof currentValue === 'object') {
        try {
          const complexValue = JSON.parse(value)
          if (typeof complexValue === 'string' || typeof complexValue === 'number') {
            context.out(`The value provided was a simple primitive...`)
            context.out(`The current value of ${key} = \n`)
            context.out(JSON.stringify(currentValue, null, 2))
            context.finish(1)
            return
          }
          value = complexValue
        } catch (e) {
          context.out(`The value provided could not be parsed\n\n${e}\n`)
          context.out(`The current value of ${key} = \n`)
          context.out(JSON.stringify(currentValue, null, 2))
          context.finish(1)
          return
        }
      } else if (currentValue !== null) {
        if (typeof currentValue === 'boolean') {
          value = value === 'true'
        } else if (typeof currentValue === 'number') {
          value = parseInt(value, 10)
        }
      }
      const path = `${key}`

      context.workspace.settings.set(path, value)

      await context.workspace.settings.save()

      context.out(`value '${path}' set and saved`)

      await context.workspace.applySettings(RunnerWindow)
    }
  }
}
