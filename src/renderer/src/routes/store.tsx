import { ChangeEvent, ReactElement, useEffect, useState } from 'react'
import short from 'short-uuid'

interface PasswordSetup {
  password: string
  passwordConfirm: string
}
export default function Store(): ReactElement {
  const [loading, setIsLoading] = useState<boolean>(true)
  const [hasStore, setHasStore] = useState<boolean>(false)
  const [setup, setIsSetup] = useState<boolean>(false)
  const [store, setStore] = useState<object>({})
  const [storeKeys, setStoreKeys] = useState<object>({})
  const [storeIsUnlocked, setStoreIsUnlocked] = useState<boolean>(false)
  const [setupError, setSetupError] = useState<string>('')
  const [saveError, setSaveError] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loginError, setLoginError] = useState<string>('')
  const [generalError, setGeneralError] = useState<string>('')

  const [passwordSetup, setPasswordSetup] = useState<PasswordSetup>({
    password: '',
    passwordConfirm: ''
  })

  const getStore = async (): Promise<void> => {
    const hasStore = await window.electron.ipcRenderer.invoke('store.is')
    if (!hasStore) {
      setIsLoading(false)
      setHasStore(false)
      setIsSetup(true)
      setStoreIsUnlocked(false)
      return
    }

    const storeIsUnlocked = await window.electron.ipcRenderer.invoke('store.unlocked')
    if (storeIsUnlocked) {
      const store = await window.electron.ipcRenderer.invoke('store.model')
      setStore(store)
      setStoreIsUnlocked(true)
      setHasStore(true)
      setIsSetup(false)
      setIsLoading(false)
    } else {
      setPassword('')
      setLoginError('')
      setIsSetup(false)
      setHasStore(true)
      setStoreIsUnlocked(false)
      setIsLoading(false)
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
          setStoreIsUnlocked(true)
          setHasStore(true)
          setIsSetup(false)
        })
        .catch((error) => {
          setIsLoading(false)
          setSetupError(error.message)
        })
    }
  }

  const onClickOpen = (): void => {
    let error = ''
    if (!password) {
      error = 'Provide the vault password!'
    }

    setLoginError(error)

    if (!error) {
      setIsLoading(true)

      window.electron.ipcRenderer
        .invoke('store.unlock', password)
        .then((store) => {
          setIsLoading(false)
          setStore(store)
          setPassword('')
          setStoreIsUnlocked(true)
          setHasStore(true)
          setIsSetup(false)
        })
        .catch((error) => {
          setIsLoading(false)
          setLoginError(error.message)
        })
    }
  }

  const onClickSave = (): void => {
    const finalStore = {
      ...store
    }

    Object.keys(storeKeys).forEach((key) => {
      const newStoreKey = storeKeys[key]

      const value: string = finalStore[key]

      delete finalStore[key]

      if (newStoreKey) {
        finalStore[newStoreKey] = value
      }
    })

    setIsLoading(true)
    setSaveError('')

    window.electron.ipcRenderer
      .invoke('store.save', finalStore)
      .then((store) => {
        setStore(store)
        setStoreKeys({})
        setIsLoading(false)
      })
      .catch((error) => {
        setIsLoading(false)
        setSaveError(error.message)
      })
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

  const onClickAdd = (): void => {
    setStore((store) => {
      return {
        ...store,
        [`KEY_${short.generate().substring(0, 4)}`]: ''
      }
    })
  }

  const onClickDelete = (key: string): void => {
    setStore((store) => {
      const newStore = {}
      Object.keys(store).forEach((storeKey) => {
        if (key !== storeKey) {
          newStore[storeKey] = store[storeKey]
        }
      })
      return newStore
    })

    setStoreKeys((store) => {
      const newStore = {}
      Object.keys(store).forEach((storeKey) => {
        if (key !== storeKey) {
          newStore[storeKey] = store[storeKey]
        }
      })
      return newStore
    })
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setPassword(event.target.value)
  }

  const handleStoreKeyChange = (key: string, event: ChangeEvent<HTMLInputElement>): void => {
    setStoreKeys((keys) => {
      return {
        ...keys,
        [key]: event.target.value
      }
    })
  }

  const handleStoreValueChange = (key: string, event: ChangeEvent<HTMLInputElement>): void => {
    setStore((store) => {
      return {
        ...store,
        [key]: event.target.value
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
          <div className="tab"></div>const password = this.vault.get(
          <span className="secret">'PASSWORD'</span>
          ) <br />
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

  if (!storeIsUnlocked) {
    return (
      <div className="info-text">
        Unlock the <span className="brand">mterm</span> vault. If you don't remember the password,
        delete the file at <span className="file-path">~/mterm/.mterm-store</span> to set this up
        again. There is no way to recover this.
        <div className="input-container">
          <input
            type="password"
            className="store-password"
            placeholder="PASSWORD"
            value={password}
            onChange={(e) => handlePasswordChange(e)}
          />
        </div>
        {loginError && <div className="info-error">{loginError}</div>}
        <button className="store-button" onClick={onClickOpen}>
          Open
        </button>
      </div>
    )
  }

  const keys = Object.keys(store)
  return (
    <div className="store-editor">
      <div className="store-editor-title">mterm vault</div>
      {keys.map((key) => (
        <div key={key} className="store-entry">
          <div className="store-entry-key">
            <input
              className="store-edit-input"
              type="text"
              value={typeof storeKeys[key] !== 'undefined' ? storeKeys[key] : key}
              onChange={(e) => handleStoreKeyChange(key, e)}
            />
          </div>
          <div className="store-entry-divider">=</div>
          <div className="store-entry-value">
            <input
              className="store-edit-input"
              type="password"
              value={store[key]}
              onChange={(e) => handleStoreValueChange(key, e)}
            />
          </div>
          <div className="store-entry-action">
            <div className="store-entry-action-delete" onClick={() => onClickDelete(key)}>
              DELETE
            </div>
          </div>
        </div>
      ))}
      {saveError && <div className="info-error">{saveError}</div>}
      <div className="store-action-add">
        <button className="store-button" onClick={onClickAdd}>
          ADD
        </button>
        <button className="store-button" onClick={onClickSave}>
          SAVE
        </button>
      </div>
    </div>
  )
}
