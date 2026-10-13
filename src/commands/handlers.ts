import type { CommandHandler, CommandName } from '@/types/command'
import { useAuth } from '@/states/auth'
import { useUsers } from '@/states/users'
import { useChannels } from '@/states/channels'

const { profile } = useAuth()
const { getByNickname } = useUsers()
const channels = useChannels()

// help functions
// search for user 
function findTargetUser(nickname: string) {
  const name = nickname.replace(/^@/, '')

  if (name.toLowerCase() === profile.value.nickname.toLowerCase()) {
    throw new Error('You cannot use this command on yourself.')
  }

  const user = getByNickname(name)
  if (!user) throw new Error(`User @${name} not found.`)
  return user
}

// channel where was command doen
function currentChannel(channelId: number | null) {
  const channel = channelId === null ? undefined : channels.getById(channelId)
  if (!channel) throw new Error('Channel not found.')
  return channel
}

// no logic, just for dialogs

export const help: CommandHandler = () => {
  return { showHelp: true }
}

export const list: CommandHandler = () => {
  return { showMembers: true }
}

export const quit: CommandHandler = (_args, context) => {
  return { confirmDelete: context.channelId! }
}

// delete channel by admin

export const cancel: CommandHandler = (_args, context) => {
  const channel = currentChannel(context.channelId)

  if (channels.isAdmin(channel.id)) {
    return { confirmDelete: channel.id }
  }

  channels.leave(channel.id)
  return {
    navigateTo: channels.joinedChannels.value[0]?.id,
    message: `Left #${channel.name}.`
  }
}

// join channel

export const join: CommandHandler = args => {
  const [name = '', visibility] = args
  const wantsPrivate = visibility === 'private'

  if (!/^[a-z0-9-]+$/.test(name)) {
    throw new Error('Channel names use lowercase letters, numbers and hyphens.')
  }

  const existing = channels.getByName(name)

  // not existis, creating it
  if (!existing) {
    const id = channels.create(name, wantsPrivate ? 'private' : 'public')
    return { navigateTo: id, message: `Created #${name}.` }
  }

  if (wantsPrivate && existing.type !== 'private') {
    throw new Error('That name already belongs to a public channel.')
  }
  if (existing.bannedIds.includes(profile.value.id)) {
    throw new Error('You are banned from this channel.')
  }
  if (existing.type === 'private' && !channels.isJoined(existing.id) && !existing.invited) {
    throw new Error('You need an invitation to join this private channel.')
  }

  channels.join(existing.id)
  return { navigateTo: existing.id, message: `Joined #${name}.` }
}

// invite

export const invite: CommandHandler = (args, context) => {
  const channel = currentChannel(context.channelId)
  const user = findTargetUser(args[0]!)
  const isAdmin = channels.isAdmin(channel.id)

  if (channel.type === 'private' && !isAdmin) {
    throw new Error('Only the administrator can invite users to a private channel.')
  }
  if (channel.bannedIds.includes(user.id) && !isAdmin) {
    throw new Error('Only the administrator can restore access for a banned user.')
  }
  if (channel.memberIds.includes(user.id)) {
    throw new Error(`@${user.nickname} is already a member.`)
  }

  channels.invite(channel.id, user.id)
  return { message: `@${user.nickname} was invited to #${channel.name}.` }
}

// revoke user

export const revoke: CommandHandler = (args, context) => {
  const channel = currentChannel(context.channelId)
  const user = findTargetUser(args[0]!)

  if (!channel.memberIds.includes(user.id)) {
    throw new Error(`@${user.nickname} is not a member of this channel.`)
  }

  channels.revoke(channel.id, user.id)
  return { message: `@${user.nickname} was removed from #${channel.name}.` }
}

// kick user

export const kick: CommandHandler = (args, context) => {
  const channel = currentChannel(context.channelId)
  const user = findTargetUser(args[0]!)

  if (!channel.memberIds.includes(user.id)) {
    throw new Error(`@${user.nickname} is not a member of this channel.`)
  }
  if (channel.adminId === user.id) {
    throw new Error('The channel administrator cannot be kicked.')
  }

  const { banned, votes } = channels.kick(channel.id, user.id)

  if (banned) {
    return { message: `@${user.nickname} was banned from #${channel.name}.` }
  }
  return { message: `Kick vote recorded for @${user.nickname} (${votes}/3).` }
}


export const handlers: Record<CommandName, CommandHandler> = {
  join,
  invite,
  revoke,
  kick,
  quit,
  cancel,
  list,
  help
}