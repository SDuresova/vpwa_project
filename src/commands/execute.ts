import { useChannels } from '../states/channels.ts'
import type { CommandDefinition } from '../types/command.ts'

const { getById, isJoined, isAdmin } = useChannels()

function checkRules(definition: CommandDefinition, channelId: number | null) {
  // command works outside the chann
  if (!definition.requiresJoined) return

  // needs to be member
  if (channelId === null || !isJoined(channelId)) {
    throw new Error('Join this channel before using this command.')
  }

  // only admin
  if (definition.adminOnly && !isAdmin(channelId)) {
    throw new Error(
      `/${definition.name} is available only to the channel administrator.`
    )
  }

  // only sort of type of channel -> /kick → public, /revoke → private
  if (
    definition.channelType &&
    getById(channelId)?.type !== definition.channelType
  ) {
    throw new Error(
      `/${definition.name} works only in ${definition.channelType} channels.`
    )
  }
}
import { commandDefinitions } from './definitions.ts'
import { parseCommand } from './parser.ts'
import { handlers } from './handlers.ts'
import type { CommandContext, CommandResult } from '../types/command.ts'

export function executeCommand(
  input: string,
  context: CommandContext
): CommandResult {
  const parsed = parseCommand(input)
  checkRules(commandDefinitions[parsed.name], context.channelId)
  return handlers[parsed.name](parsed.args, context)
}
