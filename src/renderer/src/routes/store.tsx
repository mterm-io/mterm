import { ReactElement, useState } from 'react'

export default function Store(): ReactElement {
  const [loading, setIsLoading] = useState<boolean>(false)
  const [hasStore, setHasStore] = useState<boolean>(false)
  const [setup, setIsSetup] = useState<boolean>(false)
  const [store, setStore] = useState<object>({})

  const onClickSetup = (): void => {
    setIsSetup(true)
  }

  if (loading) {
    return <p className="info-text">Loading...</p>
  }

  if (setup) {
    return (
      <div className="info-text">
        Set a password for the <span className="brand">mterm</span> password store. Remember, if
        this is forget; all secrets will irretrievable - so be sure to make this memorable and safe.
      </div>
    )
  }

  if (!hasStore) {
    return (
      <div className="info-text">
        This is the <span className="brand">mterm</span> password store. Here passwords are saved on
        your computer, stored with a layer <span className="protocol">AES-256</span> encryption. The
        way in and out of this password store is with a password.
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
