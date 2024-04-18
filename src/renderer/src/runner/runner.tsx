import { ReactElement, ChangeEvent, useEffect, useState } from 'react'
import { Runtime } from './runtime'

export default function Runner(): ReactElement {
  const [runtimeList, setRuntimes] = useState<Runtime[]>([])
  const runtimes = async (): Promise<void> => {
    const runtimesFetch: Runtime[] = await window.electron.ipcRenderer.invoke('runtimes')

    setRuntimes(runtimesFetch)
  }
  const handlePromptChange = (event: ChangeEvent<HTMLInputElement>): void => {
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

  if (!runtime) {
    return <p>Loading</p>
  }

  return (
    <>
      <div className="runner-container">
        <div className="runner-tabs">
          {runtimeList.map((runtime, index: number) => (
            <div
              key={index}
              className={`runner-tabs-title ${runtime.target ? 'runner-tabs-title-active' : undefined}`}
            >
              <div>{runtime.appearance.title}</div>
            </div>
          ))}
          <div className="runner-spacer">+</div>
        </div>
        <div className="runner-input-container">
          <div className="runner-input">
            <input
              autoFocus
              className="runner-input-field"
              placeholder=">"
              onChange={handlePromptChange}
              value={runtime.prompt}
            />
          </div>
        </div>
      </div>
    </>
  )
}
