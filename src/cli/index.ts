import { Command } from 'commander'
import { initCommand } from './commands/init.js'
import { addCommand } from './commands/add.js'
import { listCommand } from './commands/list.js'
import { mvCommand } from './commands/mv.js'
import { rmCommand } from './commands/rm.js'
import { serveCommand } from './commands/serve.js'
import { statusCommand } from './commands/status.js'

export function createCli(): Command {
  const program = new Command()

  program
    .name('board')
    .description('File-based kanban board - folders are columns, markdown files are tasks')
    .version('0.1.2')

  // Default command is serve
  program
    .option('-p, --port <port>', 'Port to run server on')
    .action(async (options) => {
      await serveCommand(options.port)
    })

  // Init command
  program
    .command('init')
    .description('Initialize a new board in the current directory')
    .action(async () => {
      await initCommand()
    })

  // Add command
  program
    .command('add <column> <title>')
    .description('Add a new task to a column')
    .option('-p, --priority <priority>', 'Task priority (low, medium, high)')
    .option('-t, --tags <tags>', 'Comma-separated tags')
    .action(async (column, title, options) => {
      await addCommand(column, title, options)
    })

  // List command
  program
    .command('list')
    .alias('ls')
    .description('List all tasks in a table')
    .action(async () => {
      await listCommand()
    })

  // Move command
  program
    .command('mv <task-id> <column>')
    .description('Move a task to a different column')
    .action(async (taskId, column) => {
      await mvCommand(taskId, column)
    })

  // Remove command
  program
    .command('rm <task-id>')
    .description('Delete a task')
    .option('-f, --force', 'Skip confirmation')
    .action(async (taskId, options) => {
      await rmCommand(taskId, options)
    })

  // Status command
  program
    .command('status')
    .description('Show running board servers')
    .action(async () => {
      await statusCommand()
    })

  return program
}
