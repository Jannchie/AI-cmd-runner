import { confirm, intro, log, note, outro } from '@clack/prompts'
import { program } from 'commander'

program
  .name('ts-cli-app-template')
  .description('A CLI app template written in TypeScript')
  .option('-y, --yes', 'Skip prompt')
  .version('v0.1.0', '-V, --version', 'Output the current version')

program.parse()
const options = program.opts()

intro('Welcome to TS CLI App Template!')
log.info('We are using @clack/prompts and commander.js.')
note('pnpm dev -h', 'You can see the help message by running:')
if (!options.yes) {
  await confirm({
    message: 'Is that cool?',
    active: 'yes',
    inactive: 'yeah',
  })
}
outro('Thanks for using TS CLI App Template!')
