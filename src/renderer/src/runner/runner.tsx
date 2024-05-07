import { ChangeEvent, ReactElement, useEffect, useRef, useState } from 'react'
import { Command, Runtime } from './runtime'
import { ContextMenu, ContextMenuItem, ContextMenuTrigger } from 'rctx-contextmenu'
import CodeMirror from '@uiw/react-codemirror'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { color } from '@uiw/codemirror-extensions-color'
import { hyperLink } from '@uiw/codemirror-extensions-hyper-link'
import { javascript } from '@codemirror/lang-javascript'
export default function Runner(): ReactElement {
  const [runtimeList, setRuntimes] = useState<Runtime[]>([])
  const [pendingTitles, setPendingTitles] = useState<object>({})
  const [historyIndex, setHistoryIndex] = useState<number>(-1)
  const [commanderMode, setCommanderMode] = useState<boolean>(false)
  const [editMode, setEditMode] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const [isMultiLine, setIsMultiLine] = useState<boolean>(false)
  const [multiLineArgs, setMultiLineArgs] = useState<string>('')

  const reloadRuntimesFromBackend = async (): Promise<void> => {
    const isCommanderMode = await window.electron.ipcRenderer.invoke('runner.isCommanderMode')
    const runtimesFetch: Runtime[] = await window.electron.ipcRenderer.invoke('runtimes')

    setRuntimes(runtimesFetch)
    setCommanderMode(isCommanderMode)
  }

  window.electron.ipcRenderer.removeAllListeners('runtime.commandEvent')
  window.electron.ipcRenderer.on('runtime.commandEvent', async () => {
    await reloadRuntimesFromBackend()
  })

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

    applyHistoryIndex(-1)
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
  const handlePromptChange = (event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>): void => {
    const value = event.target.value
    if (historyIndex !== -1) {
      applyHistoryIndex(-1)
    }

    setPrompt(value)

    window.electron.ipcRenderer.send('runtime.prompt', value)
  }

  const handleTitleChange = (id: string, event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value

    setPendingTitles((titles) => ({
      ...titles,
      [id]: value
    }))
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
    window.electron.ipcRenderer.invoke('runtime.reset-focus', runtime?.id).then(() => {
      setHistoryIndex(index)
    })
  }

  const onHistoryItemClicked = (historyIndex: number): void => {
    applyHistoryIndex(historyIndex)
  }

  const normalizeMultilineArgs = () => {
    return multiLineArgs ? ' ' + multiLineArgs.split('\n').map((line) => line.trim()).join(' ') : '';
  }

  

  const handleKeyDown = (e): void => {
    if (e.key === 'Enter' && e.shiftKey && !isMultiLine) {
      e.preventDefault();
      setIsMultiLine(true);
    }
    if (e.code === 'Backslash' || e.code === 'Backquote') {
      e.preventDefault();
      isMultiLine ? setIsMultiLine(false) : setIsMultiLine(true);
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      runtime ? runtime.prompt +=  normalizeMultilineArgs() : '';
      execute(runtime).catch((error) => console.error(error));
      setMultiLineArgs('');
      setIsMultiLine(false);
    }
    if (e.code === 'ArrowDown') {
      if (runtime && historyIndex > -1) {
        applyHistoryIndex(historyIndex - 1)
      }
    }

    if (e.code === 'ArrowUp') {
      if (runtime && historyIndex < runtime.history.length - 1) {
        applyHistoryIndex(historyIndex + 1)
      } else {
        window.electron.ipcRenderer
          .invoke('history.try-scroll-next', runtime?.id)
          .then((isHistoricalScroll: boolean) => {
            if (isHistoricalScroll) {
              applyHistoryIndex(historyIndex + 1)

              return reloadRuntimesFromBackend()
            }

            return Promise.resolve()
          })
      }
    }

    if (e.code === 'KeyC' && e.ctrlKey) {
      kill().catch((error) => console.error(error))
    }
  }

  const handleTabAction = (runtime: Runtime, action: string): void => {
    switch (action) {
      case 'rename':
        {
          setPendingTitles((titles) => ({
            ...titles,
            [runtime.id]: runtime.appearance.title
          }))
        }
        break
      default: {
        window.electron.ipcRenderer.invoke(`runtime.${action}`, runtime.id).then(() => {
          return reloadRuntimesFromBackend()
        })
      }
    }
  }

  const handleTabTitleKeyDown = (id: string, e): void => {
    if (e.key === 'Enter') {
      const titleToSave = pendingTitles[id] || ''
      if (titleToSave.trim().length > 0) {
        // something to save
        window.electron.ipcRenderer.invoke('runtime.rename', id, titleToSave).then(() => {
          return reloadRuntimesFromBackend()
        })
      }
      setPendingTitles((titles) => ({ ...titles, [id]: null }))
    }
  }

  const onResultChange = (runtimeId: string, commandId: string, value: string): void => {
    window.electron.ipcRenderer
      .invoke('runtime.set-result', runtimeId, commandId, value)
      .then(() => {
        return reloadRuntimesFromBackend()
      })
  }

  const onEditFileChange = (runtimeId: string, commandId: string, value: string): void => {
    window.electron.ipcRenderer.invoke('runtime.set-edit', runtimeId, commandId, value).then(() => {
      return reloadRuntimesFromBackend()
    })
  }
  const onEditFileKeyDown = (runtimeId: string, commandId: string, e): void => {
    if (e.code === 'KeyS' && e.ctrlKey) {
      window.electron.ipcRenderer.invoke('runtime.save-edit', runtimeId, commandId).then(() => {
        return reloadRuntimesFromBackend()
      })
    }
  }

  
  // useEffect(() => {
  //   if (isMultiLine) {
  //     textAreaRef.current?.focus();
  //   } else {
  //     inputRef.current?.focus();
  //   }
  // })

  useEffect(() => {
    if (!isMultiLine){
      historicalExecution ? 
        historicalExecution.prompt += normalizeMultilineArgs() : 
        (runtime ? runtime.prompt += normalizeMultilineArgs() : '' );
      setMultiLineArgs('');
      inputRef.current?.focus();
      return;
    }
    textAreaRef.current?.focus();
  }, [isMultiLine]);

  // useEffect(() => {
  //   inputRef.current?.focus()
  //
  //   if (Object.values(pendingTitles).filter((title) => title !== null).length > 0) {
  //     //editing session in progress
  //     return
  //   }
  //
  //   // Conditionally handle keydown of letter or arrow to refocus input
  //   const handleGlobalKeyDown = (event): void => {
  //     // if pending a title? ignore this key event: user is probably editing the window title
  //     // and does not care for input
  //
  //     if (
  //       /^[a-zA-Z]$/.test(event.key) ||
  //       event.key === 'ArrowUp' ||
  //       event.key === 'ArrowDown' ||
  //       (!event.shiftKey && !event.ctrlKey && !event.altKey)
  //     ) {
  //       if (document.activeElement !== inputRef.current) {
  //         inputRef.current?.focus()
  //       }
  //       handleKeyDown(event)
  //     }
  //   }
  //
  //   document.addEventListener('keydown', handleGlobalKeyDown)
  //
  //   return () => {
  //     document.removeEventListener('keydown', handleGlobalKeyDown)
  //   }
  // }, [])

  useEffect(() => {
    reloadRuntimesFromBackend().catch((error) => console.error(error))
  }, [])

  if (!runtime) {
    return <p>Loading</p>
  }

  const result = historicalExecution ? historicalExecution.result : runtime.result
  const resultText = result.stream.map((record) => record.text).join('')
  const resultTextRaw = result.stream.map((record) => record.raw).join('')

  let output = (
    <div className="runner-result-content">
      <pre dangerouslySetInnerHTML={{ __html: resultText }}></pre>
    </div>
  )
  if (editMode) {
    output = (
      <CodeMirror
        value={resultTextRaw}
        extensions={[color, hyperLink, javascript()]}
        theme={vscodeDark}
        onChange={(value) =>
          onResultChange(runtime.id, historicalExecution ? historicalExecution.id : '', value)
        }
        basicSetup={{ foldGutter: true }}
      />
    )
  }

  if (result.edit) {
    output = (
      <div className={'runner-editor'}>
        <div className={'runner-editor-header'}>
          <div className={'runner-editor-header-path'}>
            {' '}
            Editing {result.edit.path}
            {result.edit.modified ? '*' : ''}
          </div>
          <div className={'runner-editor-header-result'}>
            <pre>{resultTextRaw}</pre>
          </div>
        </div>
        <div className={'runner-editor-widget'}>
          <CodeMirror
            value={result.edit.content}
            extensions={[color, hyperLink, javascript()]}
            theme={vscodeDark}
            height="100%"
            onChange={(value) =>
              onEditFileChange(runtime.id, historicalExecution ? historicalExecution.id : '', value)
            }
            onKeyDown={(e) =>
              onEditFileKeyDown(runtime.id, historicalExecution ? historicalExecution.id : '', e)
            }
            basicSetup={{ foldGutter: true }}
          />
        </div>
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
                <div>
                  {pendingTitles[runtime.id] !== null && pendingTitles[runtime.id] !== undefined ? (
                    <input
                      type="text"
                      onKeyDown={(e) => handleTabTitleKeyDown(runtime.id, e)}
                      onChange={(e) => handleTitleChange(runtime.id, e)}
                      value={pendingTitles[runtime.id]}
                    />
                  ) : (
                    runtime.appearance.title
                  )}
                </div>

                <ContextMenu
                  id={`tab-context-menu-${index}`}
                  hideOnLeave={false}
                  className="tab-context-menu"
                >
                  <ContextMenuItem onClick={() => handleTabAction(runtime, 'close')}>
                    Close
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleTabAction(runtime, 'close-others')}>
                    Close Others
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleTabAction(runtime, 'close-right')}>
                    Close (right)
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleTabAction(runtime, 'duplicate')}>
                    Duplicate
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleTabAction(runtime, 'rename')}>
                    Rename
                  </ContextMenuItem>
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
                placeholder=">"
                className={`runner-input-field ${isMultiLine ? 'multi-line' : ''}`}
                onChange={handlePromptChange}
                onKeyDown={handleKeyDown}
                value={historicalExecution ? historicalExecution.prompt : runtime.prompt}
              />
              {isMultiLine ? <textarea
                ref={textAreaRef}
                placeholder='>>'
                className={`runner-textarea-field ${isMultiLine ? 'multi-line' : ''}`}
                onChange={(e) => setMultiLineArgs(e.target.value)}
                onKeyDown={handleKeyDown}
                value={multiLineArgs} /> :
                ''
              }
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
                {command.result?.edit?.modified ? ' *' : ''}
              </div>
            ))}
          </div>
          <div className="runner-info">
            <div
              onClick={() => setEditMode((rawMode) => !rawMode)}
              className={`toggle-button ${editMode ? 'toggle-button-on' : ''}`}
            >
              <div className="toggle-button-slider">
                <div className="toggle-button-spacer"></div>
                <div className="toggle-button-circle"></div>
              </div>
              {'<\\>'}
            </div>
            <div className="runner-context-folder">{runtime.folder}</div>
          </div>
        </div>
      </div>
    </>
  )
}
