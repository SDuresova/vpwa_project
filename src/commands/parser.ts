import { commandDefinitions } from "./definitions"
import { CommandName } from "@/types/command";
import { COMMANDS, ParsedCommand } from "@/types/command"

function isCommandName(name: string): name is CommandName {
    return (COMMANDS as readonly string[]).includes(name) 
}

function parseCommand(input: string): ParsedCommand {
  const [command = '', ...args] = input.trim().slice(1).split(/\s+/)

  if (!isCommandName(command)) {
    throw new Error('Invalid command! Use /help.')
  }

  return { name: command, args }
}

