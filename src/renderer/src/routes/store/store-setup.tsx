import { ReactElement } from 'react'

export default function Store(): ReactElement {
  return (
    <div className="info-text">
      Set a password for the <span className="brand">mterm</span> password store. Remember, if this
      is forget; all secrets will irretrievable - so be sure to make this memorable and safe.
    </div>
  )
}
