import { commandDefinitions } from './definitions.ts'
import { COMMANDS } from '../types/command.ts'
import type {
  CommandName,
  ParsedCommand,
  CommandDefinition
} from '../types/command.ts'

export function argumentLabel(definition: CommandDefinition): string {
  return definition.args
    .map(arg => (arg.optional ? '[' + arg.name + ']' : arg.name))
    .join(' ')
}
export function parseCommand(input: string): ParsedCommand {
  if (!input.trim().startsWith('/')) throw new Error('Commands start with /.')
  const [name = '', ...args] = input.trim().slice(1).split(/\s+/)
  if (!(COMMANDS as readonly string[]).includes(name))
    throw new Error('Unknown command. Type /help to see available commands.')
  const command = name as CommandName
  const definition = commandDefinitions[command]
  if (
    args.length < definition.args.filter(arg => !arg.optional).length ||
    args.length > definition.args.length ||
    definition.args.some(
      (arg, index) =>
        args[index] !== undefined &&
        arg.values &&
        !arg.values.includes(args[index]!)
    )
  ) {
    throw new Error(
      ('Usage: /' + name + ' ' + argumentLabel(definition)).trim()
    )
  }
  return { name: command, args }
}
