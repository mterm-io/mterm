import { ChangeEvent, ReactElement, useEffect, useRef, useState, RefObject, createRef } from 'react'
import { Command, Runtime } from './runtime'
import { ContextMenu, ContextMenuItem, ContextMenuTrigger } from 'rctx-contextmenu'
import CodeMirror from '@uiw/react-codemirror'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { color } from '@uiw/codemirror-extensions-color'
import { hyperLink } from '@uiw/codemirror-extensions-hyper-link'
import { javascript } from '@codemirror/lang-javascript'
import RunnerAC from './runner-ac'
import { Suggestion } from './autocomplete'
export default function Runner(): ReactElement {
  const [runtimeList, setRuntimes] = useState<Runtime[]>([])
  const [pendingTitles, setPendingTitles] = useState<object>({})
  const [historyIndex, setHistoryIndex] = useState<number>(-1)
  const [commanderMode, setCommanderMode] = useState<boolean>(false)
  const [editMode, setEditMode] = useState<boolean>(false)
  const [suggestion, setSuggestion] = useState<Suggestion>({
    list: []
  })
  const [suggestionSelection, setSuggestionSelection] = useState<number>(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const historyRefs = useRef<Array<RefObject<HTMLDivElement>>>([])

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

  historyRefs.current = runtime?.history
    ? runtime.history.map((_, i) => historyRefs.current[i] ?? createRef())
    : []

  const execute = async (runtime): Promise<void> => {
    const command: Command = await window.electron.ipcRenderer.invoke(
      'runtime.prepareExecute',
      runtime.id,
      runtime.prompt,
      'default'
    )

    applyHistoryIndex(-1)
    setSuggestion({
      list: []
    })

    setMultiLineArgs('')
    setIsMultiLine(false)

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

  const changePrompt = (prompt: string): void => {
    setPrompt(prompt)

    window.electron.ipcRenderer.send('runtime.prompt', prompt)

    const cursor = inputRef?.current?.selectionEnd
    window.electron.ipcRenderer.invoke('runtime.complete', prompt, cursor ?? -1).then((r) => {
      setSuggestion(r)
      setSuggestionSelection(0)
    })
  }
  const handlePromptChange = (
    event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>
  ): void => {
    const value = event.target.value
    if (historyIndex !== -1) {
      applyHistoryIndex(-1)
    }

    changePrompt(value)
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
      // scroll to history index
      const element = historyRefs.current[index]?.current
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'start'
        })
      }
    })
  }

  const onHistoryItemClicked = (historyIndex: number): void => {
    applyHistoryIndex(historyIndex)
  }

  const handleLineBreak = (e): void => {
    const cursorPosition = e.target?.selectionStart
    if (e.target === inputRef.current) {
      if (!isMultiLine) setIsMultiLine(true)
      e.preventDefault()
      setMultiLineArgs(
        runtime?.prompt.slice(cursorPosition, runtime.prompt.length) +
          (multiLineArgs ? '\n' + multiLineArgs : '')
      )
      if (runtime) setPrompt(runtime.prompt.slice(0, cursorPosition))
      textAreaRef.current?.focus()
    }
  }

  const handleKeyDown = (e): void => {
    if (e.key === 'Enter' && e.shiftKey) {
      handleLineBreak(e)
    }
    if ((e.code === 'Backslash' || e.code === 'Backquote') && !e.shiftKey) {
      e.preventDefault()
      setIsMultiLine(!isMultiLine)
    }
    if (e.code === 'Backspace' && isMultiLine) {
      if (e.target === textAreaRef.current && e.target.selectionStart === 0) {
        e.preventDefault()
        const multiLineSplit = multiLineArgs.trim().split('\n')
        const _firstLine = runtime?.prompt.trim()
        setPrompt(_firstLine + (_firstLine ? ' ' : '') + multiLineSplit.shift())
        setMultiLineArgs(multiLineSplit.join('\n'))

        if (multiLineSplit.length < 1) {
          setIsMultiLine(false)
        }

        inputRef.current?.focus()
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      if (!runtime) return
      execute({
        ...runtime,
        prompt:
          runtime.prompt.trim() +
          (isMultiLine && multiLineArgs ? '\n' + multiLineArgs : multiLineArgs)
      }).catch((error) => console.error(error))
    }
    if (e.code === 'ArrowDown') {
      if (historyIndex === -1) {
        if (suggestionSelection < suggestion.list.length - 1) {
          setSuggestionSelection(suggestionSelection + 1)
        } else if (isMultiLine && !e.ctrlKey && e.target === inputRef.current) {
          const linebreakIndex = multiLineArgs.indexOf('\n')
          const cursorPosition = e.target?.selectionStart
          window.electron.ipcRenderer.invoke('runtime.complete', runtime?.prompt, 0).then(() => {
            textAreaRef.current?.focus()
            cursorPosition < linebreakIndex || linebreakIndex === -1
              ? textAreaRef.current?.setSelectionRange(cursorPosition, cursorPosition)
              : textAreaRef.current?.setSelectionRange(linebreakIndex, linebreakIndex)
          })
        }
      } else if (runtime && historyIndex > -1) {
        if (historyIndex === 0) {
          setPrompt('')
          setIsMultiLine(false)
          setMultiLineArgs('')
        }
        applyHistoryIndex(historyIndex - 1)
      }
    }

    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      let cursor = inputRef?.current?.selectionEnd ?? -1

      // the selectionEnd hasn't updated yet. add and go
      if (e.code === 'ArrowLeft') {
        cursor--
      } else if (e.code === 'ArrowRight') {
        cursor++
      }

      if (cursor <= 0) {
        cursor = 0
      } else if (cursor >= (runtime?.prompt?.length ?? 0)) {
        cursor = runtime?.prompt?.length ?? 0
      }

      window.electron.ipcRenderer
        .invoke('runtime.complete', runtime?.prompt, cursor ?? -1)
        .then((r) => {
          setSuggestion(r)
          setSuggestionSelection(0)
        })
    }

    if (e.code === 'Tab') {
      e.preventDefault()
      e.stopPropagation()

      const suggestionEntry = suggestion.list[suggestionSelection]
      if (suggestionEntry) {
        changePrompt(suggestionEntry.prompt)
      }
    }

    if (e.code === 'Escape') {
      //exit suggestions
      setSuggestion({
        list: []
      })
    }

    if (e.code === 'ArrowUp') {
      if (suggestionSelection > 0) {
        setSuggestionSelection(suggestionSelection - 1)
      } else if (isMultiLine && !e.ctrlKey) {
        const linebreakIndex = multiLineArgs.indexOf('\n')
        const cursorPosition = e.target?.selectionStart
        if (linebreakIndex < 0 || cursorPosition <= linebreakIndex) {
          window.electron.ipcRenderer.invoke('runtime.complete', runtime?.prompt, 0).then(() => {
            inputRef.current?.focus()
            inputRef.current?.setSelectionRange(cursorPosition, cursorPosition)
          })
        }
      } else if (runtime && historyIndex < runtime.history.length - 1) {
        applyHistoryIndex(historyIndex + 1)
        setSuggestion({
          list: []
        })
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

  useEffect(() => {
    const runtime = runtimeList.find((r) => r.target)
    if (!runtime) {
      return
    }
    const eventList =
      (historyIndex === -1
        ? runtime.result.events
        : runtime.history[historyIndex]?.result?.events) || []

    const eventMap = eventList.map((o) => o.event)
    const eventMapSet = new Set<string>()

    for (const event of eventMap) {
      eventMapSet.add(event)
    }

    const checkAndSendEventForContent = (event): void => {
      const element = event.target

      const matchingEvents = eventList.filter(
        (backendEvent) =>
          [element.parentElement.id, element.id].includes(backendEvent.contentId) &&
          event.type === backendEvent.event
      )

      matchingEvents.forEach((eventToFire) => {
        window.electron.ipcRenderer.invoke('runtime.run-context-event', eventToFire).then(() => {
          return reloadRuntimesFromBackend()
        })
      })
    }

    const eventListName = Array.from(eventMapSet.values())

    eventListName.forEach((eventName) =>
      document.addEventListener(eventName, checkAndSendEventForContent)
    )

    return () => {
      eventListName.forEach((eventName) =>
        document.removeEventListener(eventName, checkAndSendEventForContent)
      )
    }
  }, [historyIndex, runtimeList])

  useEffect(() => {
    reloadRuntimesFromBackend().catch((error) => console.error(error))
  }, [])

  useEffect(() => {
    let styleSheet = document.getElementById('theme')
    if (!styleSheet) {
      styleSheet = document.createElement('style')
      styleSheet.setAttribute('id', 'theme')
      document.head.appendChild(styleSheet)
    }

    window.electron.ipcRenderer
      .invoke('runner.theme', runtimeList.find((o) => o.target)?.profile)
      .then((theme) => {
        styleSheet.innerText = theme
      })

    return () => {}
  }, [runtimeList])

  useEffect(() => {
    if (isMultiLine) {
      textAreaRef.current?.focus()
      return
    }

    if (runtime) setPrompt(runtime.prompt.trim() + (multiLineArgs ? ' ' : '') + multiLineArgs)
    setMultiLineArgs('')
    inputRef.current?.focus()
  }, [isMultiLine])

  useEffect(() => {
    if (!historicalExecution || !historicalExecution.prompt) {
      return
    }

    const splitPoint = historicalExecution?.prompt.indexOf('\n')
    if (!splitPoint || splitPoint === -1) {
      setIsMultiLine(false)
      setMultiLineArgs('')
      setPrompt(historicalExecution.prompt)
      return
    }

    setIsMultiLine(true)
    setPrompt(historicalExecution.prompt.substring(0, splitPoint))
    setMultiLineArgs(
      historicalExecution.prompt.substring(splitPoint + 1, historicalExecution.prompt.length)
    )
  }, [historicalExecution])

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
              <div className={isMultiLine ? 'multiline-input-container' : ''}>
                <input
                  ref={inputRef}
                  placeholder=">"
                  className={`runner-input-field ${isMultiLine ? 'multi-line' : ''}`}
                  onChange={handlePromptChange}
                  onKeyDown={handleKeyDown}
                  value={runtime.prompt}
                />
              </div>

              {isMultiLine ? (
                <textarea
                  ref={textAreaRef}
                  placeholder=">>"
                  className={`runner-textarea-field ${isMultiLine ? 'multi-line' : ''}`}
                  onChange={(e) => setMultiLineArgs(e.target.value)}
                  onKeyDown={handleKeyDown}
                  value={multiLineArgs}
                />
              ) : (
                ''
              )}
              <RunnerAC suggestion={suggestion} selection={suggestionSelection} />
            </div>
          </div>
          <div className={`runner-result ${result.code !== 0 ? '' : ''}`}>{output}</div>
        </div>
        <div className="runner-context">
          <div className="runner-history">
            {runtime.history.map((command, index) => (
              <div
                key={index}
                ref={historyRefs.current[index]}
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
