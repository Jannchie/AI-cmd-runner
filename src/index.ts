import process from 'node:process'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import childProcess from 'node:child_process'
import { confirm, intro, isCancel, log, note, outro, spinner } from '@clack/prompts'
import { program } from 'commander'
import { createJsonTranslator, createLanguageModel } from 'typechat'

interface Config {
  env: ConfigEnv
}

interface ConfigEnv {
  AZURE_OPENAI_API_KEY?: string
  AZURE_OPENAI_ENDPOINT?: string
}

const config = await getConfig()

export interface Cmd { shell: 'bash' | 'powershell' | 'zsh'; command: string; comments: string }

const model = createLanguageModel(config.env as Record<string, string>)
const cmdTranslator = createJsonTranslator<Cmd>(model, 'export interface Cmd { shell: \'bash\' | \'powershell\' | \'zsh\'; command: string; comments: string }', 'Cmd')

async function getConfig(): Promise<Config> {
  const defaultConfig: Config = { env: {} }
  const homeDir = os.homedir()
  const configPath = path.join(homeDir, '.config', 'cmdrun', 'config.json')
  if (fs.existsSync(configPath)) {
    const config = await fs.promises.readFile(configPath, 'utf-8')
    return JSON.parse(config)
  }
  else {
    await fs.promises.mkdir(path.dirname(configPath), { recursive: true })
    await fs.promises.writeFile(configPath, JSON.stringify(defaultConfig))
    return defaultConfig
  }
}

async function updateEnv(name: keyof ConfigEnv, value: string) {
  const homeDir = os.homedir()
  const configPath = path.join(homeDir, '.config', 'cmdrun', 'config.json')
  if (!config.env)
    config.env = {}
  config.env[name] = value
  fs.writeFileSync(configPath, JSON.stringify(config))
}

function isConfigEnvKey(key: string): key is keyof ConfigEnv {
  return key === 'AZURE_OPENAI_API_KEY' || key === 'AZURE_OPENAI_ENDPOINT'
}

program
  .name('run')
  .description('Convert natural language to script')
  .option('-y, --yes', 'Skip confirmation')
  .arguments('<target>')
  .action(async (target) => {
    const options = program.opts()
    const yes = options.yes
    function createCmdPrompt(target: string) {
      const shell = userShell()
      const promptTemplate = `You are an AI assistant who can generate any ${shell} script to help users. Now, the user asks you to "${target}". You can assume that the user has global access to the command, and that the user doesn't need to replace any variables or set any paths. you will run this ${shell} script to help the user.\`\`\``
      return promptTemplate
    }

    const s = spinner()
    intro('Run start')
    s.start('Generate solution...')
    const strResp = await model.complete(createCmdPrompt(target))
    if (!strResp.success) {
      s.stop(strResp.message, 1)
      return
    }
    s.message('Parsing script...')
    const resp = await cmdTranslator.translate(strResp.data)
    if (resp.success) {
      s.stop('Script generated', 0)
      const cmd = resp.data
      log.message(cmd.command)
      note(cmd.comments, 'Tip')
      if (!yes) {
        const resp = await confirm({
          message: 'Do you want to run this script?',
        })
        if (isCancel(resp) || !resp)
          return
      }

      const command = cmd.command
      childProcess.spawn(command, { shell: cmd.shell, stdio: 'inherit' })
      outro('Run complete')
      process.exit(0)
    }
    else {
      log.error('Failed to generate script')
      log.error(resp.message)
      outro('Run failed')
      process.exit(1)
    }
  })
  .command('env <name> <value>')
  .description('Set a env variable')
  .action(async (name, value) => {
    // set to global config file
    intro('Run set env start')
    if (isConfigEnvKey(name)) {
      await updateEnv(name, value)
      log.success(`Set ${name} to ${value}`)
      outro('Run set env complete')
      process.exit(0)
    }
    else {
      log.error(`Invalid env name ${name}`)
      outro('Run set env failed')
      process.exit(1)
    }
  })

program.parse()

function userShell() {
  if (process.platform === 'win32') {
    return 'PowerShell'
  }
  else {
    if (process.env.SHELL === '/bin/bash')
      return 'Bash'
    else if (process.env.SHELL === '/bin/zsh')
      return 'Zsh'
    else
      return 'Bash'
  }
}
