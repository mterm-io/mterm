
<h1 align="right">mterm</h1>
<h5 align="right">An electron terminal written with React and TypeScript.</h5>
<p align="right">
  <img alt="slate@taff" width="100px" src="resources/icon.png">
</p>
<h5 align="right">Join us on discord @ <a href=https://discord.gg/mterm">discord.gg/mterm</a></h5>

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mterm-io_mterm&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=mterm-io_mterm)
[![release](https://github.com/mterm-io/mterm/actions/workflows/release.yml/badge.svg)](https://github.com/mterm-io/mterm/actions/workflows/release.yml)

> This documentation is a work in progress!


![image](https://github.com/mterm-io/mterm/assets/7341502/27bcad62-6891-4b49-80b5-e5a17e0562ab)

### Commands

Need your own command? MTERM includes `~/mterm/commands.ts` from your home directory - with any exported functions as available commands.

Here an example -
```typescript
import * as os from 'node:os'

export function hello(name: string = os.userInfo().username): string {
  return `Hi, ${name}`
}
````

Now run `hello X` from mterm -

![image](https://github.com/mterm-io/mterm/assets/7341502/a042d214-e528-41bd-929c-5f3de6d994cd)

> In this case, no argument was provided so the `os.userInfo().username` was the fallback. `Hello, DR` is the result!

Try fetching data!

```typescript
export async function query(): Promise<{
  userId: number
  id: number
  title: string
  completed: boolean
}> {
  const response = await fetch('https://jsonplaceholder.typicode.com/todos/1')

  return await response.json()
}
```

![image](https://github.com/mterm-io/mterm/assets/7341502/df8e74d4-896c-4964-861d-bad3ced17c80)

> Note the return type is optional, just added above to highlight the typescript engine provided 

### Project Setup

### Install

```bash
$ yarn
```

### Development

```bash
$ yarn dev
```

### To switch from command mode to window mode

```bash
$ control + shift + ~
```

### Build

```bash
# For windows
$ yarn build:win

# For macOS
$ yarn build:mac

# For Linux
$ yarn build:linux
```
