import { ChangeEvent, ReactElement, useEffect, useState, useRef } from 'react'
import { Command, ResultStreamEvent, Runtime } from './runtime'
import { ContextMenuTrigger, ContextMenu, ContextMenuItem } from 'rctx-contextmenu'
export default function Runner(): ReactElement {
  const [runtimeList, setRuntimes] = useState<Runtime[]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)
  const [commanderMode, setCommanderMode] = useState<boolean>(false)
  const [rawMode, setRawMode] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const reloadRuntimesFromBackend = async (): Promise<void> => {
    const isCommanderMode = await window.electron.ipcRenderer.invoke('runner.isCommanderMode')
    const runtimesFetch: Runtime[] = await window.electron.ipcRenderer.invoke('runtimes')

    setRuntimes(runtimesFetch)
    setCommanderMode(isCommanderMode)
  }

  window.electron.ipcRenderer.removeAllListeners('runtime.commandEvent')
  window.electron.ipcRenderer.on(
    'runtime.commandEvent',
    async (_, streamEntry: ResultStreamEvent) => {
      console.log(streamEntry)

      await reloadRuntimesFromBackend()
    }
  )

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

  const execute = async (runtime): Promise<void> => {
    const command: Command = await window.electron.ipcRenderer.invoke(
      'runtime.prepareExecute',
      runtime.id,
      historicalExecution ? historicalExecution.prompt : runtime.prompt,
      'default'
    )

    await reloadRuntimesFromBackend()

    // renderer -> "backend"
    await window.electron.ipcRenderer.invoke('runtime.execute', command)

    await reloadRuntimesFromBackend()
  }

  const kill = async (): Promise<void> => {
    if (!historicalExecution) {
      return
    }
    const runtime = historicalExecution.runtime
    const id = historicalExecution.id

    await window.electron.ipcRenderer.invoke('runtime.kill', id, runtime)

    await reloadRuntimesFromBackend()
  }
  const handlePromptChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value
    console.log(event)
    if (historyIndex !== -1) {
      applyHistoryIndex(-1)
    }

    setPrompt(value)

    window.electron.ipcRenderer.send('runtime.prompt', value)
  }

  const selectRuntime = (runtimeIndex: number): void => {
    window.electron.ipcRenderer.send('runtime.index', runtimeIndex)

    setRuntimes((runtimes) => {
      return [
        ...runtimes.map((runtime, index) => ({
          ...runtime,
          target: index === runtimeIndex
        }))
      ]
    })
  }
  const onAddRuntimeClick = (): void => {
    window.electron.ipcRenderer.invoke('runtimes.add').then((runtimes: Runtime[]) => {
      setRuntimes(runtimes)
    })
  }

  const applyHistoryIndex = (index: number): void => {
    setHistoryIndex(index)
  }

  const onHistoryItemClicked = (historyIndex: number): void => {
    applyHistoryIndex(historyIndex)
  }

  const handleKeyDown = (e): void => {
    if (e.key === 'Enter') {
      execute(runtime).catch((error) => console.error(error))
    }
    if (e.code === 'ArrowDown') {
      if (runtime && historyIndex > -1) {
        applyHistoryIndex(historyIndex - 1)
      }
    }

    if (e.code === 'ArrowUp') {
      if (runtime && historyIndex < runtime.history.length - 1) {
        applyHistoryIndex(historyIndex + 1)
      }
    }

    if (e.code === 'KeyC' && e.ctrlKey) {
      kill().catch((error) => console.error(error))
    }
  }

  useEffect(() => {
    inputRef.current?.focus()

    // Conditionally handle keydown of letter or arrow to refocus input
    const handleGlobalKeyDown = (event): void => {
      if (
        /^[a-zA-Z]$/.test(event.key) ||
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown' ||
        (!event.shiftKey && !event.ctrlKey && !event.altKey)
      ) {
        if (document.activeElement !== inputRef.current) {
          inputRef.current?.focus()
        }
        handleKeyDown(event)
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [])

  useEffect(() => {
    reloadRuntimesFromBackend().catch((error) => console.error(error))
  }, [])

  if (!runtime) {
    return <p>Loading</p>
  }

  const result = historicalExecution ? historicalExecution.result : runtime.result
  const resultText = result.stream.map((record) => record.text).join('')

  let output = (
    <div className="runner-result-content">
      <pre dangerouslySetInnerHTML={{ __html: resultText }}></pre>
    </div>
  )
  if (rawMode) {
    const resultTextRaw = result.stream.map((record) => record.raw).join('')
    output = (
      <div className="runner-result-content">
        <pre>{resultTextRaw}</pre>
      </div>
    )
  }

  return (
    <>
      <div
        className={`runner-container ${commanderMode ? 'runner-container__commander_mode' : 'runner-container__normal_mode'}`}
      >
        <div className="runner-tabs">
          {runtimeList.map((runtime, index: number) => (
            <ContextMenuTrigger key={index} id={`tab-context-menu-${index}`}>
              <div
                onClick={() => selectRuntime(index)}
                className={`runner-tabs-title ${runtime.target ? 'runner-tabs-title-active' : undefined}`}
              >
                <div>{runtime.appearance.title}</div>

                <ContextMenu
                  id={`tab-context-menu-${index}`}
                  hideOnLeave={false}
                  className="tab-context-menu"
                >
                  <ContextMenuItem>Close</ContextMenuItem>
                  <ContextMenuItem>Close Others</ContextMenuItem>
                  <ContextMenuItem>Close (right)</ContextMenuItem>
                  <ContextMenuItem>Duplicate</ContextMenuItem>
                  <ContextMenuItem>Rename</ContextMenuItem>
                </ContextMenu>
              </div>
            </ContextMenuTrigger>
          ))}
          <div className="runner-spacer" onClick={onAddRuntimeClick}>
            +
          </div>
        </div>
        <div className="runner-main">
          <div className="runner-input-container">
            <div className="runner-input">
              <input
                ref={inputRef}
                autoFocus
                className="runner-input-field"
                placeholder=">"
                onChange={handlePromptChange}
                onKeyDown={handleKeyDown}
                value={historicalExecution ? historicalExecution.prompt : runtime.prompt}
              />
            </div>
          </div>
          <div className={`runner-result ${result.code !== 0 ? '' : ''}`}>{output}</div>
        </div>
        <div className="runner-context">
          <div className="runner-history">
            {runtime.history.map((command, index) => (
              <div
                key={index}
                className={`runner-history-item ${historyIndex === index ? 'runner-history-selected' : ''} ${
                  command.complete
                    ? command.aborted
                      ? 'runner-history-aborted'
                      : 'runner-history-complete'
                    : 'runner-history-running'
                } ${command.error ? 'runner-history-error' : ''}`}
                onClick={() => onHistoryItemClicked(index)}
              >
                {command.prompt}
              </div>
            ))}
          </div>
          <div className="runner-info">
            <div
              onClick={() => setRawMode((rawMode) => !rawMode)}
              className={`toggle-button ${rawMode ? 'toggle-button-on' : ''}`}
            >
              <div className="toggle-button-slider">
                <div className="toggle-button-spacer"></div>
                <div className="toggle-button-circle"></div>
              </div>
              raw
            </div>
            <div className="runner-context-folder">{runtime.folder}</div>
          </div>
        </div>
      </div>
    </>
  )
}
