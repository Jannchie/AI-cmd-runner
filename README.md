# AI Command Runner

## Example

```log
$ run "docker downlod and run this image: dperson/torproxy, with auto restart, and expose 9050 port"
┌  Run start
│
◇  Script generated
│
│  docker run -d --restart always -p 9050:9050 dperson/torproxy
│
◇  Do you want to run this script?
│  Yes
│
◇  Run complete
b639306084657d5bd0f412e8b7b9fd4f628f29bd36b38eb2e9036a5ba4bca692
```

## Install

```bash
pnpm install -g ai-cmd-runner
```

## Usage

```bash
run -h
```

## License

MIT
