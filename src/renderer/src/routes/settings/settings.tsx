import { ReactElement } from 'react'
import { Outlet } from 'react-router-dom'

export default function Settings(): ReactElement {
  return (
    <>
      <p>This is a settings page</p>
      <div id="detail">
        <Outlet />
      </div>
    </>
  )
}
