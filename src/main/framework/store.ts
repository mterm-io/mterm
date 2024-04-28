import { pathExists, readFile, writeFile } from 'fs-extra'
import { get as getFromPath, merge } from 'lodash'
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

function decrypt(encryptedText: string, password: string): string {
  const [ivHex, encrypted] = encryptedText.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const key = createHash('sha256').update(password).digest('base64').substr(0, 32)
  const decipher = createDecipheriv('aes-256-ctr', key, iv)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
function encrypt(text: string, password: string): string {
  const iv = randomBytes(16)
  const key = createHash('sha256').update(password).digest('base64').substring(0, 32)
  const cipher = createCipheriv('aes-256-ctr', key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return `${iv.toString('hex')}:${encrypted}`
}

export class Store {
  private vault: object = {}
  public unlocked: boolean = false
  constructor(private location: string) {}

  value<T>(path: string): T {
    return getFromPath(this.vault, path)
  }

  async exists(): Promise<boolean> {
    return await pathExists(this.location)
  }

  set(key: string, value: string): void {
    this.vault[key] = value
  }
  async save(password: string): Promise<void> {
    const prettyJSON = JSON.stringify(this.vault, null, 2)

    const text = encrypt(prettyJSON, password)

    await writeFile(this.location, text, 'utf-8')
  }

  async open(password: string): Promise<void> {
    this.unlocked = false
    this.vault = {}

    const textBuffer = await readFile(this.location)
    const text = textBuffer.toString()

    const json = decrypt(text, password)

    const map = JSON.parse(json)

    this.unlocked = true

    merge(this.vault, map)
  }

  get(key: string, orElse: string = ''): string {
    const value = this.value(key)
    if (value === undefined) {
      return orElse
    }
    return `${value}`
  }
}
