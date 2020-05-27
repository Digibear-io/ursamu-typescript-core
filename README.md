# UrsaMU: A Modern MUSH Server

![Repo Cover Image](./ursamu_github_banner.png)

## What is UrsaMU

**UrsaMU** is a **modern implementation** of the **MUSH** style internet talker, built on the shoulders of giants, and impimented with [Typescript](typescriptlang.org) and [Socket.io](socket.io). While slightly opinionated towards a MUSH command and data structure, **UrsaMU** is flexible enough to be configured to fit most needs. For an in depth look at the inner workings of **UrsaMU**, check out the [documentation](#).

> **UrsaMU** Is still in the very early stages in development. This file (and repo) Are subject to change unexpectedly until the initial `0.1.0` release.

[Installation](#Installation)<br>
[Configuration](#) <br>
[Basic Usage](#basic-usage)<br>
[Data Structure](#data-structure)<br>
[Flags](#flags)<br>
[Softcode Commands](#commands)<br>
[Scripting](#scripting)<br>
[Services](#Services)<br>
[Hooks](#hooks)<br>
[Plugins](#plugins)<br>
[License](#license)<br>
[Feature Roadmap](#feature-roadmap)

## Installation

`coming soon!` UrsaMU isn't quite stable enough for testing yet! We're getting there though :)

## Basic Usage

First make sure to edit your config files in ./config to taste, then `npm start dev`.

## Data Structure

**UrsamMU** communicates all of it's messages between client and server using specific JSON. The data property acts as a place to pass whatever 'off band' data you need when communicating with either end. When being sent to the client, the following data is available:

```JSON
{
  "command": "message",
  "message": "A String to return to the client",
  "data": {}
}
```

Once a message is sent to the server, it's slightly reformatted for internal record keeping as an object literal:

```JavaScript
{
  socket, // Sender socket info.
  payload: {
    command: "Foo",
    message: "Bar!",
    data: {}
  }
}
```

## Commands

**UrsaMU** Allows you to write commands, and even override the few commands the core package ships with.

```JavaScript
import { cmds, payload } from "@ursamu/core";
import { MuRequest } from "@ursamu/core/types";

cmds.add({
  name: "Test",
  flags: "connected",
  pattern: "+test *",
  exec: async (req: MuRequest, args: string[]) =>
    payload(req, {
      command: "response",
      message: `Woot! You typed '${args[1]}'!`
    })
})
```

- `name` The name of the command.
- `flags` A string of flags the object must have or not (!) have to use the command. Access flags.
- `pattern` accepts either wildcard string format, or regular expressions for more fine tuned control. Internally, the wildcard is replaced with a regular expression equiv.
- `exec(req: MuRequest, args: string[])` The actual command code to be executed. Takes two arguments, `req` and `args`. Req is the request object sent to the server, and the args array is the result of a match result against the string given to the command.
- `payload()` Format the payload sectiontion of the response so you can just give the pieces that are important to your code.

## Functions

I'm still working through functions at the moment,

## Services

Services are their core, a handler for various commands send from the client, to the server, IE player input (messages), auth requests, character creation, connection, etc. A Service takes in a `MuRequest`, and returns a new `MuRequest`.

```JavaScript
  import { Services, payload } from "@ursamu/core";
  import { MuRequest } from "@ursamu/core/types";

  // Create a new service handler.  When the client sends a
  // reuquest sith the command: "somename", this handler will activate.
  service.add("somename", (req: MuRequest) => {
    // Send a response back to the client ...

   // ... something with the req object here.

    return payload(req, {
        data: {
          results: { foo: "bar" }
        }
      })
  })
```

## Hooks

Hooks are reusable pieces of code, that can be executed on multiple services. They can run before or after a service.

```JavaScript
  // From our example above, we can extend it with a couple of hooks..
  // This hook updates the message of the request object before returning it
  mu.service("somename").hook("before", async (req: MuRequest) =>
    payload(req, {
      message: "This came from the hook!",
    })
  )

```

## License

`MIT`

### Planned Feature Roadmap

The working list for basic server features I want to have accomplished for **UrsaMU** Before releasing `0.1.0 beta`:

- [x] **Database**: Handle your data however you want! **UrsaMU** allows you to bring your favorite database to the table with it's **database adapter API**.
- [x] **Commands**: Enter your own custom commands through the **command API**.
- [x] **Flags** The game's flags are editable from either the **API** or through stored JSON flat files - or both!
- [x] **MushCode**: Evaluate mushcode expressions!
- [ ] **Attributes** Store and evaluate and register commands and functions through MUSH-Like **attributes api**.
- [ ] **Grid** Build a grid in-game, load rooms or entire pre-built areas from flat JSON files or both!
- [x] **Input Middleware**: The server allows for registering middleware to handle how in-game input.
