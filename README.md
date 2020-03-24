# UrsaMU

![Repo Cover Image](./ursamu_github_banner.png)

## What is UrsaMU

**UrsaMU** is a **modern implementation** of the **MUSH** style internet talker, built on the shoulders of giants, and impimented with Typescript.

## Planned Features

The working list for basic server features. **UrsaMU** Is still under extreme development, so this list is subject to shrink (Or grow!):

- [ ] **Live Reboots**: UrsaMU is composed of two layers, **UrsaMajor** the game engine, and **UrsaMinor** the networking layer. This way the engine can be updated without shutting down the connections to your game.
- [x] **Database**: Handle your data however you want! **UrsaMU** allows you to bring your favorite database to the table with it's **database adapter API**.
- [x] **Commands**: Enter your own custom commands through the **command API**.
- [x] **Flags** The game's flags are editable from either the **API** or through stored JSON flat files - or both!
- [ ] **MushCode**: Evaluate mushcode expressions!
- [ ] **Attributes** Store and evaluate and register commands and functions through MUSH-Like **attributes api**.
- [x] **Grid** Build a grid in-game, load rooms or entire pre-built areas from flat JSON files or both!
- [x] **Input Middleware**: The server allows for registering middleware to handle how in-game input.

## Installation

Installing **UrsaMU** is a snap.

```
git clonse https://github.com/digibear.io/ursamu.git
cd ursamu
npm install
```

Make sure you change your default settings in `config/config.json` then:

```
npm start
```

Or to start the server with filewatching enabled:

```
npm run start:watch
```

## License

`MIT`
