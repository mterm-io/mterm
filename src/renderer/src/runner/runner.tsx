import { ReactElement, useEffect, useState } from 'react'
import { Runtime } from './runtime'

export default function Runner(): ReactElement {
  const [runtimeList, setRuntimes] = useState<Runtime[]>([
    {
      prompt: '',
      target: true
    }
  ])
  const runtimes = async (): Promise<void> => {
    const runtimesFetch: Runtime[] = await window.electron.ipcRenderer.invoke('runtimes')

    setRuntimes(runtimesFetch)
  }
  const handlePromptChange = (event): void => {
    const value = event.target.value

    setRuntimes((runtimes) => {
      return [
        ...runtimes.map((runtime) => ({
          ...runtime,
          prompt: runtime.target ? value : runtime.prompt
        }))
      ]
    })

    window.electron.ipcRenderer.send('runtime.prompt', value)
  }

  const runtime = runtimeList.find((runtime) => runtime.target)

  useEffect(() => {
    runtimes().catch((error) => console.error(error))
  }, [])

  console.log('doing this', runtime)

  if (!runtime) {
    return <p>Loading</p>
  }

  return (
    <div className="runner-container">
      <div className="runner-input">
        <input
          className="runner-input-field"
          placeholder=">"
          onChange={handlePromptChange}
          value={runtime.prompt}
        />
      </div>
    </div>
  )
}
