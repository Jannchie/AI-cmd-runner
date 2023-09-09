# TS CLI App Template

This is a template for a CLI app written in TypeScript.

## Usage

Developing:

```bash
pnpm install
pnpm dev
```

We have integrated [@clack/prompt](https://github.com/natemoo-re/clack) and  [commander.js](https://github.com/tj/commander.js#readme).

```log
┌  Welcome to TS CLI App Template!
│
●  We are using @clack/prompts and commander.js.
│
◇  You can see the help message by running: ─╮
│                                            │
│  pnpm dev -h                               │
│                                            │
├────────────────────────────────────────────╯
│
◇  Is that cool?
│  yeah
│
└  Thanks for using TS CLI App Template!
```

You can see the help message by running:

```bash
pnpm dev -h
```

Building:

```bash
pnpm build
```

## License

MIT
