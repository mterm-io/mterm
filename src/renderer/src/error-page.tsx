import { useRouteError } from 'react-router-dom'
import { ReactElement } from 'react'
const hasStatusText = (value: unknown): value is { statusText: string } => {
  return typeof value === 'object' && value !== null && 'statusText' in value
}
const hasErrorMessage = (value: unknown): value is { errorMessage: string } => {
  return typeof value === 'object' && value !== null && 'errorMessage' in value
}
export default function ErrorPage(): ReactElement {
  const error = useRouteError()

  console.error(error)

  const errorMessage: string = hasStatusText(error)
    ? error.statusText
    : hasErrorMessage(error)
      ? error.errorMessage
      : `${error}`

  return (
    <div id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{errorMessage}</i>
      </p>
      <a href="/">Home</a>
    </div>
  )
}
