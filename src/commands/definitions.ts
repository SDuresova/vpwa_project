import type { CommandDefinition, CommandName } from '../types/command'

// Record<CommandName, …> → TS vyhodí chybu, ak niektorý príkaz chýba.
export const commandDefinitions: Record<CommandName, CommandDefinition> = {
  join: {
    name: 'join',
    description: 'Join or create a channel',
    args: [{ name: 'channelName' }, { name: 'private', optional: true, values: ['private'] }], // 2 arguments, 1 must have second is optional
    requiresJoined: false,
    adminOnly: false
  },
  invite: {
    name: 'invite',
    description: 'Invite a user or restore access',
    args: [{ name: 'nickName' }],
    requiresJoined: true,
    adminOnly: false
  },
  revoke: {
    name: 'revoke',
    description: 'Remove a private-channel member (admin)',
    args: [{ name: 'nickName' }],
    requiresJoined: true,
    adminOnly: true,
    channelType: 'private'
  },
  kick: {
    name: 'kick',
    description: 'Vote to ban a public-channel member',
    args: [{ name: 'nickName' }],
    requiresJoined: true,
    adminOnly: false,
    channelType: 'public'
  },
  quit: {
    name: 'quit',
    description: 'Delete this channel (admin)',
    args: [],
    requiresJoined: true,
    adminOnly: true
  },
  cancel: {
    name: 'cancel',
    description: 'Leave this channel',
    args: [],
    requiresJoined: true,
    adminOnly: false
  },
  list: {
    name: 'list',
    description: 'Show channel members',
    args: [],
    requiresJoined: true,
    adminOnly: false
  },
  help: {
    name: 'help',
    description: 'Show command help',
    args: [],
    requiresJoined: false,
    adminOnly: false
  }
}