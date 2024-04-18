import { ReactElement, ChangeEvent, useEffect, useState } from 'react'
import { Runtime } from './runtime'

export default function Runner(): ReactElement {
  const [runtimeList, setRuntimes] = useState<Runtime[]>([])
  const [result, setResult] = useState<string>('_')
  const [historyIndex, setHistoryIndex] = useState<number>(-1)
  const runtimes = async (): Promise<void> => {
    const runtimesFetch: Runtime[] = await window.electron.ipcRenderer.invoke('runtimes')

    setRuntimes(runtimesFetch)
  }
  const setPrompt = (prompt: string): void => {
    setRuntimes((runtimes) => {
      return [
        ...runtimes.map((runtime) => ({
          ...runtime,
          prompt: runtime.target ? prompt : runtime.prompt
        }))
      ]
    })
  }

  const runtime = runtimeList.find((runtime) => runtime.target)
  const historicalExecution = historyIndex != -1 ? runtime?.history[historyIndex] : undefined

  const execute = async (): Promise<void> => {
    const execution = window.electron.ipcRenderer.invoke('runtime.execute')

    setPrompt('')

    const result: string = await execution

    setResult(result)

    await runtimes()
  }
  const handlePromptChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value
    if (runtime?.prompt !== value && historyIndex !== -1) {
      setHistoryIndex(-1)
    }

    setPrompt(value)

    window.electron.ipcRenderer.send('runtime.prompt', value)
  }

  const handleKeyDown = (e): void => {
    if (e.key === 'Enter') {
      execute().catch((error) => console.error(error))
    }

    if (e.code === 'ArrowDown') {
      if (runtime && historyIndex < runtime.history.length - 1) {
        setHistoryIndex((historyIndex) => historyIndex + 1)
      }
    }

    if (e.code === 'ArrowUp') {
      if (runtime && historyIndex > -1) {
        setHistoryIndex((historyIndex) => historyIndex - 1)
      }
    }

    console.log(e)
  }

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
        <div className="runner-main">
          <div className="runner-input-container">
            <div className="runner-input">
              <input
                autoFocus
                className="runner-input-field"
                placeholder=">"
                onChange={handlePromptChange}
                onKeyDown={handleKeyDown}
                value={historicalExecution ? historicalExecution.prompt : runtime.prompt}
              />
            </div>
          </div>
          <div className="runner-result">
            {historicalExecution ? historicalExecution.result : result}
          </div>
        </div>
        <div className="runner-context">
          <div className="runner-history">
            {runtime.history.map((command, index) => (
              <div>
                {historyIndex === index ? '**' : undefined} {command.prompt}
              </div>
            ))}
          </div>
          <div className="runner-context-folder">{runtime.folder}</div>
        </div>
      </div>
    </>
  )
}
