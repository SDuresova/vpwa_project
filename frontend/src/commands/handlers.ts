import type { CommandHandler, CommandName } from '../types/command'
import { useChannels } from '../states/channels'
import { act } from '../states/chat'

export const help: CommandHandler = () => ({ showHelp: true })
export const list: CommandHandler = () => ({ showMembers: true })
export const quit: CommandHandler = (_args, context) => ({ confirmDelete: context.channelId! })
export const cancel: CommandHandler = async (_args, context) => {
  if (useChannels().isAdmin(context.channelId!)) return { confirmDelete: context.channelId! }
  return act('cancel', context.channelId!)
}
export const join: CommandHandler = args => act('join', undefined, args)
export const invite: CommandHandler = (args, context) => act('invite', context.channelId!, args)
export const revoke: CommandHandler = (args, context) => act('revoke', context.channelId!, args)
export const kick: CommandHandler = (args, context) => act('kick', context.channelId!, args)
export const handlers: Record<CommandName, CommandHandler> = { join, invite, revoke, kick, quit, cancel, list, help }
