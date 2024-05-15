import { ExecuteContext } from '../execute-context'
import { errorModal } from '../../index'

export default {
  command: ':theme',
  alias: [':css'],
  async task(context: ExecuteContext, task?: string): Promise<void> {
    context.out('')
    if (!task) {
      if (!context.profile) {
        context.out(
          'No profile file to edit, make sure your ~/mterm/settings.json defaultProfile is set'
        )
        return
      }

      const profileThemeLocation = context.workspace.theme.getProfileThemeLocation(context.profile)
      if (!profileThemeLocation) {
        context.out(
          'No theme location was found for the default profile, please check your settings!'
        )
        return
      }

      await context.edit(profileThemeLocation, async () => {
        context.out('Saved theme file!\n')

        try {
          await context.workspace.theme.load()
        } catch (e) {
          console.log(e)
          await errorModal.showError(e)
        }

        context.out('Theme reloaded\n')
      })
    }
  }
}
