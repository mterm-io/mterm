import { ChangeEvent, ReactElement, useEffect, useState } from 'react'
import { Runtime } from '../runner/runtime'

interface PasswordSetup {
  password: string
  passwordConfirm: string
}
export default function Store(): ReactElement {
  const [loading, setIsLoading] = useState<boolean>(true)
  const [hasStore, setHasStore] = useState<boolean>(false)
  const [setup, setIsSetup] = useState<boolean>(false)
  const [store, setStore] = useState<object>({})
  const [setupError, setSetupError] = useState<string>('')
  const [generalError, setGeneralError] = useState<string>('')

  const [passwordSetup, setPasswordSetup] = useState<PasswordSetup>({
    password: '',
    passwordConfirm: ''
  })

  const getStore = async (): Promise<void> => {
    const hasStore = await window.electron.ipcRenderer.invoke('store.setup')
    if (!hasStore) {
      setIsLoading(false)
      setHasStore(false)
      setIsSetup(true)
      return
    }
  }

  const onClickSetup = (): void => {
    setIsSetup(true)
  }

  const onClickCreate = (): void => {
    let error = ''
    if (passwordSetup.password !== passwordSetup.passwordConfirm) {
      error = 'The passwords do not match!'
    }
    if (passwordSetup.password.length < 5) {
      error = 'The password needs to be at least 5 characters!'
    }

    setSetupError(error)

    if (!error) {
      setIsLoading(true)
      setPasswordSetup({
        password: '',
        passwordConfirm: ''
      })

      window.electron.ipcRenderer
        .invoke('store.setup', passwordSetup.password)
        .then((store) => {
          setIsLoading(false)
          setStore(store)
          setHasStore(true)
          setIsSetup(false)
        })
        .catch((error) => {
          setIsLoading(false)
          setSetupError(error.message)
        })
    }
  }

  useEffect(() => {
    getStore().catch((error) => {
      setIsLoading(false)
      setGeneralError(error.message)
    })
  }, [])

  if (generalError) {
    return <div className="info-text">{generalError}</div>
  }

  if (loading) {
    return <div className="info-text">Loading...</div>
  }

  const handlePasswordSetupChange = (key: string, event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value

    setPasswordSetup((passwordSetup) => {
      return {
        ...passwordSetup,
        [key]: value
      }
    })
  }

  if (setup) {
    return (
      <div className="info-text">
        Set a password for the <span className="brand">mterm</span> vault. Remember, if this is
        forget; all secrets will irretrievable - so be sure to make this memorable and safe.
        <div className="input-container">
          <input
            type="password"
            className="store-password"
            placeholder="PASSWORD"
            value={passwordSetup.password}
            onChange={(e) => handlePasswordSetupChange('password', e)}
          />
        </div>
        <div className="input-container">
          <input
            type="password"
            className="store-password"
            placeholder="PASSWORD AGAIN"
            value={passwordSetup.passwordConfirm}
            onChange={(e) => handlePasswordSetupChange('passwordConfirm', e)}
          />
        </div>
        {setupError && <div className="info-error">{setupError}</div>}
        <button className="store-button" onClick={onClickCreate}>
          Create
        </button>
      </div>
    )
  }

  if (!hasStore) {
    return (
      <div className="info-text">
        This is the <span className="brand">mterm</span> vault. Here passwords, secrets, api keys
        and more are saved on your computer, stored with a layer of {''}
        <span className="protocol">AES-256</span> encryption. The way in and out of this vault is
        with a password.
        <div className="info-text-header">
          After setting up the store, you can fetch these passwords in two ways on the terminal
        </div>
        <div className="info-text-header">As a variable in the prompt -</div>
        <pre className="info-text-example">
          echo $_.<span className="secret">PASSWORD</span>
        </pre>
        <div className="info-text-header">Within extensions and scripts -</div>
        <pre className="info-text-example">
          export async function login() &#123; <br />
          <div className="tab"></div>await this.get(<span className="secret">'PASSWORD'</span>){' '}
          <br />
          <br />
          <div className="tab"></div>...rest
          <br />
          &#125;
        </pre>
        <button className="store-button" onClick={onClickSetup}>
          Setup
        </button>
      </div>
    )
  }

  return <p>STORE SETUP</p>
}
