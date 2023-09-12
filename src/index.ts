import process from 'node:process'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import childProcess from 'node:child_process'
import { confirm, intro, isCancel, log, note, outro, spinner } from '@clack/prompts'
import { program } from 'commander'
import { createJsonTranslator, createLanguageModel } from 'typechat'

const version = process.env.npm_package_version ?? 'unknown'

interface Config {
  env: ConfigEnv
}

interface ConfigEnv {
  AZURE_OPENAI_API_KEY?: string
  AZURE_OPENAI_ENDPOINT?: string
}

const config = await getConfig()

export interface Cmd { shell: 'bash' | 'powershell' | 'zsh'; command: string; tip: string }

const model = createLanguageModel(config.env as Record<string, string>)
const cmdTranslator = createJsonTranslator<Cmd>(model, 'export interface Cmd { shell: \'bash\' | \'powershell\' | \'zsh\'; command: string; tip: string }', 'Cmd')
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
  .version(version)
  .description('Convert natural language to script')
  .option('-y, --yes', 'Skip confirmation')
  .option('-d, --debug', 'Debug mode')
  .arguments('<goal>')
  .action(async (goal) => {
    const { yes, debug } = program.opts()
    function createCmdPrompt(target: string) {
      const shell = userShell()
      const promptTemplate = `I am an AI assistant capable of generating and executing commands to assist users. The user has requested the following task: "${target}". I can assume that the user has unrestricted access to the command. I may utilize the ${shell} if required. If necessary, I will generate a tip. The shell script I will execute is:\n\`\`\``
      return promptTemplate
    }

    const s = spinner()
    intro(`ai-cmd-runner v${version}`)
    s.start('Generate solution...')
    const strResp = await model.complete(createCmdPrompt(goal))
    if (!strResp.success) {
      s.stop(strResp.message, 1)
      return
    }

    if (debug)
      log.message(strResp.data) // for debug

    s.message('Parsing script...')
    const resp = await cmdTranslator.translate(strResp.data)
    if (resp.success) {
      s.stop('Script generated', 0)
      const cmd = resp.data
      log.message(cmd.command)
      if (cmd.tip !== '')
        note(cmd.tip, 'Tip')
      if (!yes) {
        const resp = await confirm({
          message: 'Do you want to run this script?',
        })
        if (isCancel(resp) || !resp)
          return
      }
      const runSpinner = spinner()
      runSpinner.start('Running...')
      const command = cmd.command
      try {
        await new Promise<string>((resolve, reject) => {
          childProcess.exec(command, {
            shell: userShell(),
          }, (err, stdout) => {
            runSpinner.stop('Run complete', 0)
            if (err) {
              reject(err)
            }
            else {
              // eslint-disable-next-line no-console
              console.info(stdout)
              resolve(stdout)
            }
          })
        })
      }
      catch (e) {
        console.error(`${e}`)
        process.exit(1)
      }
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
