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
[Mushcode Functions](#functions)<br>
[Services](#Services)<br>
[Hooks](#hooks)<br>
[Plugins](#plugins)<br>
[License](#license)<br>
[Feature Roadmap](#feature-roadmap)

## Installation

`coming soon!` UrsaMU isn't stable enough for testing yet! :)

## Basic Usage

**UrsaMU** Can bind to any webserver software that runs on the base Node.js http(s) modules (Express, Next, Sapper, Koa, etc, etc...), or it can run it's own standalone http server with some very basic request handling functionality.

### Node.js HTTP

```JavaScript
import mu from "@ursamu/core";
import {createServer} from "http";

// Start a server and bind Ursamu to it.
const server = createServer(/* handler */);
mu.server(server).listen(8000);
```

### With Express

```JavaScript
import mu from "@ursamu/core";
import express from "express";

// Create an express app
const app = express();

// create a new route for the app.
app.get("/", (req:Request, res: Response) => {
  res.send("<h1>Welcome to UrsaMU!</h1>");
  res.end();
})

// Attach the mu to the express app, and listen for connections.
mu.server(app).listen(8000);
```

### Or Standalone.

```JavaScript
mu.serve(8000)
```

The same goes for the **Socket.io** implementation. If you have a specality setup for your communication layer, **UrsaMU** can bind to it.

```JavaScript
import io from "Socket.io";
import http from "http";

const server = http.createServer(/* handler like express */);
const IOServer = io(server);

mu.attach(IOServer);
server.listen(8000)
```

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

Adding a mushcode function is similar to adding a command, except working with the parser instead of the `cmds` object. Functions can be evaluated by commands. As with traditional mushcode, adding square braces `[]` around a function expression imbedded within a string will evaluate the code before the string is returned.

```JavaScript
import { parser, DBObj, Scope } from "@ursamu/core";

// Add a list of numbers together `add(1,2,3,4)`.
parser.add("add", (en: DBObj, args: string[], scope: Scope) => {
  return args
    .map(arg => parseInt(arg) ? parseInt(arg) : 0)
    .reduce((prev: number, curr: number) => prev += curr, 0);
})
```

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
  service.get("somename").hook("before", async (req: MuRequest) =>
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
