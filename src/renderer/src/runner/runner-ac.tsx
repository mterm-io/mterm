import { ReactElement } from 'react'
import { Suggestion, SuggestionEntryType } from './autocomplete'

type RunnerACProps = {
  suggestion: Suggestion
}
export default function RunnerAC({ suggestion, selection }: RunnerACProps): ReactElement {
  if (!suggestion || !suggestion.prompt) {
    return <></>
  }

  const itemLength = suggestion.list.length + 1

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
      <div
        className={`runner-ac-option runner-ac-option-${getLabel(suggestion.prompt.type)}`}
        style={{ height: `${entryHeight}px` }}
      >
        <div className="runner-ac-prompt">
          <div className="runner-ac-prompt-text">{suggestion.prompt.prompt}</div>
        </div>
        <div className="runner-ac-badge">
          <div className="runner-ac-badge-text runner-ac-badge-text-tab">TAB</div>
          <div className="runner-ac-badge-text">{getLabel(suggestion.prompt.type)}</div>
        </div>
      </div>
      {suggestion.list.map((item, index) => (
        <div
          className={`runner-ac-option runner-ac-option-${getLabel(item.type)}`}
          key={index}
          style={{ height: `${entryHeight}px` }}
        >
          <div className="runner-ac-prompt">
            <div className="runner-ac-prompt-text">{item.prompt}</div>
          </div>
          <div className="runner-ac-badge">
            <div className="runner-ac-badge-text">{getLabel(item.type)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
