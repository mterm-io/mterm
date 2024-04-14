import { ReactElement } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function ErrorRuntimePage(): ReactElement {
  const [searchParams] = useSearchParams()

  const exit = (): void => window.electron.ipcRenderer.send('system.exit')
  const workspace = (): void => window.electron.ipcRenderer.send('open.workspace')

  let info = searchParams.get('message')

  if (info === undefined || info === null) {
    info = JSON.stringify(
      {
        error: 'Something went wrong...',
        reason: 'Unknown'
      },
      null,
      2
    )
  }

  const errorMessage: string = info

  return (
    <div id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <button onClick={exit}>Exit</button>
      <button onClick={workspace}>Workspace</button>
      <hr />
      <pre>
        <code>{errorMessage}</code>
      </pre>
    </div>
  )
}
