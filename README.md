
<h1 align="left">mterm</h1>
<h5 align="left">An electron terminal written with TypeScript, and rendered with React.</h5>
<h5 align="left">Join us on discord @ <a href=https://discord.gg/mterm">discord.gg/mterm</a></h5>
<img alt="mterm" width="50px" src="resources/icon.png">

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mterm-io_mterm&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=mterm-io_mterm)
[![release](https://github.com/mterm-io/mterm/actions/workflows/release.yml/badge.svg)](https://github.com/mterm-io/mterm/actions/workflows/release.yml)

![image](https://github.com/mterm-io/mterm/assets/7341502/6eb47f43-1ab5-41c5-9c0e-5eb61ce575bf)
![image](https://github.com/mterm-io/mterm/assets/7341502/27bcad62-6891-4b49-80b5-e5a17e0562ab)

**mterm** is a cross-platform command-line terminal that proxies the underlying command-line interpreters, such as [powershell](https://learn.microsoft.com/en-us/powershell/), [sh](https://pubs.opengroup.org/onlinepubs/9699919799/utilities/sh.html) or [wsl](https://ubuntu.com/desktop/wsl). commands are executed in the background and results streamed to the foreground.

this means commands such as `ls`, `cd` or program commands such as `node -v` or `yarn install` will work out of the box as long as the host machine supports these commands. you can configure the desired interpreter [below](#configure)

### Why
- by no means does mterm replace your sh, or pwsh but we think abstractions such as [secrets](#secrets), and [commands](#commands) can supplement your development routines
  - in other words, instead of building a utility for a dev task in a shell script for local use, use typescript
- mterm comes with tabs but also within the scope of a tab; each command is ran in the background - this means you can use your keyboard to hop around execution stacks
- output for commands do not stay in the terminal when you work on a new command. this new workflow considers the last execution while typing your next - but expects you to be in control of what you want to see (you'll have to see this to understand)

### Install

Head over to the [release page](https://github.com/mterm-io/mterm/releases/latest) to find the binary for your system type. mterm is evergreen and updates are automatically installed on your system as hey get released. Run `:v` to see your current mterm version.

### Command Mode

By default, **mterm** opens in command mode (you can change this in [settings](#settings)). A couple of notes about command mode -
- This window is always on top
- This window follows to any desktop
- The font and theme is larger to account for large size

This is a nice way to focus on execution details but it can be annoying if multiple windows are in use.

Hide mterm with the default toggle hotkey -
```bash
~ + CommandOrControl
```

Disable command mode and go to normal terminal window mode with -
```bash
~ + Shift + CommandOrControl
```

Or change the behaviour of all of this with [settings](#settings).

### Configure

mterm creates the `mterm` folder on a host machine on first launch a the user's home directory

for windows -
```bash
C:/Users/<YOUR_NAME>/mterm
```

for mac -
```bash
/Users/<YOUR_NAME>/mterm
```

for everything else -
```bash
/home/<YOUR_NAME>/mterm
```

in this folder, there are a couple of important files to help configure mterm -

- `commands.ts`, used to attach commands to the terminal. see [commands](#commands)
- `package.json`, an npm package declaration for use by [commands](#commands)
- `settings`, general runtime settings [settings](#settings)

### Settings

here is an example `~/mterm/settings.json` -

```json
{
  "defaultProfile": "wsl",
  "profiles": {
    "powershell": {
      "platform": "C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe -noprofile -command $ARGS",
      "theme": "theme.css",
      "icon": "default"
    },
    "wsl": {
      "platform": "bash -c $ARGS",
      "theme": "theme.css",
      "icon": "default"
    }
  },
  "runner": {
    "shortcut": "`+CommandOrControl",
    "bounds": {
      "screen": "PRIMARY",
      "x": "SCREEN:-.5",
      "y": "SCREEN:-.5",
      "w": 720,
      "h": 500
    },
    "commanderModeShortcut": "`+Shift+CommandOrControl",
    "commanderMode": true,
    "commanderModeBounds": {
      "screen": 0,
      "x": 0,
      "y": "SCREEN:-.5",
      "w": "SCREEN",
      "h": 500
    }
  }
}
```

- default profile: the desired platform to execute commands against
- profiles: a list of profiles in the terminal
- runner
  - shortcut: the global hotkey to toggle the runner
  - bounds: the location of the terminal
    - screen: `PRIMARY | number`, use the primary monitor or use the desired screen #
    - x, y, w, h: `SCREEN:ratio | number` use a ratio of the screen size (for centering etc) or use a static number
  - commandModeShorcut: the hotkey to toggle [command mode](#command-mode)
  - commandMode: should mterm start by default in [command mode](#command-mode)?
  - commanderModeBounds: the location of the terminal in command mode
    - screen: `PRIMARY | number`, use the primary monitor or use the desired screen #
    - x, y, w, h: `SCREEN:ratio | number` use a ratio of the screen size (for centering etc) or use a static number


### System

mterm provided a few system commands to help control the terminal and settings. mterm settings will always start with `:` (a colon) unless the intention is to override a system command. for example, because `clear` needs to be handled in a special way for mterm windows + tabs, it is overriden in mterm.

| Command                      | Alias  | Purpose                                                                                |
|------------------------------|--------|----------------------------------------------------------------------------------------|
| `clear`                      | `cls`  | Clear the current terminal output                                                      |
| `cd`                         |        | Navigate the file tree on the host machine                                             |
| `:exit`                      | `exit` | Exit the current tab, or mterm if only 1 tab is open                                   |
| `:edit`                      | `edit` | Open the in-terminal editor with the file provided. Hit `Ctrl+S` to save in the editor |
| `:history`                   |        | Print out terminal history for debugging in a JSON format                              |
| `:reload`                    |        | Reload settings, the ui, and commands without restarting                               |
| `:tab`                       |        | Open a new tab                                                                         |
| `:test`                      |        | Sample command that executes after 10 seconds. Helpful for debugging                   |
| `:vault`                     |        | Open the secret management tool, the mterm vault                                       |
| `:version`                   | `:v`   | Print the current mterm version                                                        |
| `:workspace`                 |        | Open the mterm workspace folder on disk: `~/mterm`                                     |
| `:settings`                  |        | Open the mterm settings gui to manage `~/mterm/settings.json`                          |
| `:settings edit`             |        | Open the `~/mterm/settings.json` in the terminal editor with hot reloading             |
| `:settings reload`           |        | Reload `~/mterm/settings.json` and all ui etc associated with the settings             |
| `:settings {get\|set} {key}` |        | Set the setting key matching the path in `~/mterm/settings.json` and reload            |

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

<img src="https://github.com/mterm-io/mterm/assets/7341502/df8e74d4-896c-4964-861d-bad3ced17c80" alt="drawing" width="500"/>


> Note the return type is optional, just added above to highlight the typescript engine provided

### Transformers
Sometimes we need to "transform" data. mterm provides `transformers` in the form of operators in the prompt. These transformers simplify terminal activities by abstract common tasks that would otherwise be tedious to write out. They also provide a

### Secrets

Environment variables are a bit unsafe. You set these and leave the host machine all the ability to read and share these. Wonderful for services and backends, not the safest for personal usage.

While `mterm` does support reading env variables in the terminal, an alternative much safer secret mechanism is provided.

Passwords, URLS (any value really) can be stored in the vault -

<img src="https://github.com/mterm-io/mterm/assets/7341502/ad55761a-a7b7-4a13-987e-23caf5e21ef2" alt="drawing" width="250"/>

> Open the vault wih `:vault` or use the tray icon open `Vault and Secrets`

The mterm vault is an `AES-256` encrypted store on your local machine. During setup, you provide a password for this store.

<img src="https://github.com/mterm-io/mterm/assets/7341502/423161d4-c5da-4185-9938-36c823eb9091" alt="drawing" width="250"/>

Every time `mterm` is launched, the password is required to use these values provided. You can find vault values by using `this.vault.get` in commands -

````typescript
export function who() {
  const name = this.vault.get('NAME')

  return `name: ${name}`
}

````

![image](https://github.com/mterm-io/mterm/assets/7341502/76b26a62-33ea-4883-b07c-677f99ab3355)

### Editor

mterm provides an editor with `:edit <FILE>` or `edit <FILE>` commands -

![image](https://github.com/mterm-io/mterm/assets/7341502/25db8038-7a86-419c-a5d7-777b97025ec7)

hit `control + s` within the file editor to save this


### Other Notes

When you change the tab name to include `$idx` - this will be replaced with the current tab index

You can install packages in the `~/mterm` folder and use them in `commands.ts`

### contributing

see [local setup](#local-setup) for code setup info.

ensure editor has prettier settings configured for `.pretierrc.yaml` or PRs will fail.

every commit must be in [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) format. this is how we auto generate release notes and change logs. features might be ignored if this rule is not followed.

make sure to make a pr with this format: `feature/<name_or_issue_number>`.

reach out on [discord](https://discord.gg/mterm) for contributor role.

### local setup

requires [node](https://nodejs.org/en/blog/release/v20.9.0)
requires [yarn](https://yarnpkg.com/getting-started/install)

> note: quickly install yarn on node 20+ with `corepack enable`

clone -

```bash
git clone git@github.com:mterm-io/mterm.git
```

install deps -
```bash
yarn
```

run locally -
```bash
$ yarn dev
```

### build

note, because these require github token during build - this will probably fail for you. adding here either way for completeness

```bash
# For windows
yarn build:win

# For macOS
yarn build:mac

# For Linux
yarn build:linux
```
