# mterm

An electron terminal written with React and TypeScript.

![image](https://github.com/mterm-io/mterm/assets/7341502/27bcad62-6891-4b49-80b5-e5a17e0562ab)

## Community
Join us on discord [here](https://discord.gg/mterm)!

## Extend with commands

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


## Project Setup

### Install

```bash
$ yarn
```

### Development

```bash
$ yarn dev
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
