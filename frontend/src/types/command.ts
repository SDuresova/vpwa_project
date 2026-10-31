import type { ChannelPrivacyType } from './channel.ts'

export const COMMANDS = [
  'join',
  'invite',
  'revoke',
  'kick',
  'quit',
  'cancel',
  'list',
  'help'
] as const
export type CommandName = (typeof COMMANDS)[number]

export interface CommandArg {
  name: string // channelname alebo nickname
  optional?: boolean
  values?: string[] // priv alebo pub
}

export interface CommandDefinition {
  name: CommandName
  description: string
  args: CommandArg[]
  requiresJoined: boolean
  adminOnly: boolean
  channelType?: ChannelPrivacyType
}

export interface ParsedCommand {
  name: CommandName
  args: string[]
}

export interface CommandContext {
  // check in which channel has been done
  channelId: number | null
}

export interface CommandResult {
  message?: string // message for user
  navigateTo?: number // channel id to redirect
  showHelp?: boolean // show help dialog
  showMembers?: boolean // show memebrs dialog
  confirmDelete?: number // channel id for delete
}

export type CommandHandler = (
  args: string[],
  context: CommandContext
) => CommandResult
