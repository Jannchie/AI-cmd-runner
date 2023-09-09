# Cmdrun

This is a template for a CLI app written in TypeScript.

## Example

```log
# Jannchie @ JANNCHIE-DESKTOP in C:\Code\cmdrun on git:main [20:45:20]
$ run "添加到暂存区"
┌  Run start
│
◇  Script generated
│
│  git add .
│
◇  Tip ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│                                                                                                                                                               │
│  This command will add all the changes in the current directory to the staging area. Make sure you are in the correct directory before running this command.  │
│                                                                                                                                                               │
├───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
│
◇  Do you want to run this script?
│  Yes
│
└  Run complete
```

## Install

```bash
pnpm install -g cmdrun
```

## Usage

```bash
run -h
```

## License

MIT
