import { ReactElement } from 'react'
import { Suggestion, SuggestionEntryType } from './autocomplete'

type RunnerACProps = {
  suggestion: Suggestion
  selection: number
}
export default function RunnerAC({ suggestion, selection }: RunnerACProps): ReactElement {
  if (!suggestion || !suggestion.list.length) {
    return <></>
  }

  const itemLength = suggestion.list.length

  const width = 600
  const maxItemsVisible = 5
  const entryHeight = 30
  const inputOffset = 50
  const topOffset = Math.min(maxItemsVisible, itemLength) * entryHeight

  const style = {
    height: `${topOffset}px`,
    width: `${width}px`,
    top: `${inputOffset}px`
  }

  function getLabel(type: SuggestionEntryType): string {
    switch (type) {
      case SuggestionEntryType.COMMAND_SYSTEM:
        return 'system'
      case SuggestionEntryType.COMMAND_USER:
        return 'command'
      case SuggestionEntryType.HISTORY:
        return 'history'
      case SuggestionEntryType.PROGRAM:
        return 'program'
      case SuggestionEntryType.PATH:
        return 'path'
    }
  }

  return (
    <div className="runner-ac" style={style}>
      {suggestion.list.map((item, index) => (
        <div
          className={`runner-ac-option runner-ac-option-${getLabel(item.type)} ${index === selection ? 'runner-ac-option-selected' : 'runner-ac-option-not-selected'}`}
          key={index}
          style={{ height: `${entryHeight}px` }}
        >
          <div className="runner-ac-prompt">
            <div className="runner-ac-prompt-text">{item.prompt}</div>
          </div>
          <div className="runner-ac-badge">
            {index === selection ? (
              <div className="runner-ac-badge-text runner-ac-badge-text-tab">TAB</div>
            ) : undefined}
            <div className="runner-ac-badge-text">{getLabel(item.type)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
