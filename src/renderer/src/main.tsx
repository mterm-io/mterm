import './assets/main.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'

import ErrorPage from './error-page'
import Runner from './runner/runner'
import About from './routes/about'
import Settings from './routes/settings/settings'
import Store from './routes/store'
import SettingsGeneral from './routes/settings/settings-general'
import SettingsTheme from './routes/settings/settings-theme'
import ErrorRuntimePage from './error-runtime'

const router = createHashRouter([
  {
    path: '/',
    element: <Runner />,
    errorElement: <ErrorPage />
  },
  {
    path: '/about',
    element: <About />
  },
  {
    path: '/error',
    element: <ErrorRuntimePage />
  },
  {
    path: '/store',
    element: <Store />
  },
  {
    path: '/settings',
    element: <Settings />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'general',
        element: <SettingsGeneral />,
        index: true
      },
      {
        path: 'theme',
        element: <SettingsTheme />
      }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
