import { ReactElement } from 'react'

export default function Runner(): ReactElement {
  return (
    <div className="runner-container">
      <div className="runner-input">
        <input className="runner-input-field" placeholder=">" />
      </div>
    </div>
  )
}
