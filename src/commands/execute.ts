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
import { useUsers } from '../states/users.ts'
import type {
  CommandContext,
  CommandResult,
  CommandHandler,
  CommandName
} from '../types/command.ts'

const channels = useChannels()
function targetId(args: string[]): number {
  const user = useUsers().getByNickname(args[0]!.replace(/^@/, ''))
  if (!user) throw new Error('User not found in the demo directory.')
  return user.id
}
const handlers: Record<CommandName, CommandHandler> = {
  help: () => ({ showHelp: true }),
  list: () => ({ showMembers: true }),
  join: args => {
    const name = args[0]!
    const existing = channels.getByName(name)
    if (existing && args[1] && existing.type !== 'private')
      throw new Error('That name already belongs to a public channel.')
    const id =
      existing?.id ??
      channels.create(name, args[1] === 'private' ? 'private' : 'public')
    channels.join(id)
    return { navigateTo: id, message: 'Joined #' + name + '.' }
  },
  invite: (args, context) => {
    channels.invite(context.channelId!, targetId(args))
    return {
      message: '@' + args[0]!.replace(/^@/, '') + ' added to the channel.'
    }
  },
  revoke: (args, context) => {
    channels.revoke(context.channelId!, targetId(args))
    return { message: 'Member removed.' }
  },
  kick: (args, context) => {
    const result = channels.kick(context.channelId!, targetId(args))
    return {
      message: result.banned
        ? 'Member banned.'
        : 'Kick vote recorded (' + result.votes + '/3).'
    }
  },
  quit: (_args, context) => ({ confirmDelete: context.channelId! }),
  cancel: (_args, context) => {
    const id = context.channelId!
    if (channels.isAdmin(id)) return { confirmDelete: id }
    channels.leave(id)
    return {
      navigateTo: channels.joinedChannels.value[0]?.id,
      message: 'You left the channel.'
    }
  }
}
export function executeCommand(
  input: string,
  context: CommandContext
): CommandResult {
  const parsed = parseCommand(input)
  checkRules(commandDefinitions[parsed.name], context.channelId)
  return handlers[parsed.name](parsed.args, context)
}
