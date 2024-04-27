
<h1 align="right">mterm</h1>
<h5 align="right">An electron terminal written with React and TypeScript.</h5>
<p align="right">
  <img alt="slate@taff" width="100px" src="resources/icon.png">
</p>
<h5 align="right">Join us on discord @ <a href=https://discord.gg/mterm">discord.gg/mterm</a></h5>

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mterm-io_mterm&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=mterm-io_mterm)
[![release](https://github.com/mterm-io/mterm/actions/workflows/release.yml/badge.svg)](https://github.com/mterm-io/mterm/actions/workflows/release.yml)

> This documentation is a work in progress!

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
