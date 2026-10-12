import { ref } from 'vue'

// Local prototype data; shared by the sidebar and command input.
export const channels = ref([
  {
    name: 'project-invitation',
    type: 'private',
    invited: true,
    invitationRead: false
  },
  {
    name: 'general',
    type: 'public',
    unread: 3,
    members: [
      { nick: 'alice', status: 'online' },
      { nick: 'bob', status: 'DND' },
      { nick: 'cyprian', status: 'offline', isAdmin: true }
    ]
  },
  {
    name: 'random',
    type: 'public',
    members: [
      { nick: 'david', status: 'online' },
      { nick: 'fabio', status: 'DND' }
    ]
  },
  {
    name: 'vpwa-team',
    type: 'private',
    unread: 1,
    isAdmin: true,
    members: [{ nick: 'ida', status: 'online' }]
  }
])

export const isJoined = channel =>
  !!channel && !channel.invited && !channel.left

export function leaveChannel(channel) {
  if (channel.isAdmin) {
    channels.value = channels.value.filter(item => item !== channel)
  } else {
    channel.left = true
    channel.pinned = false
  }
}

export const commandDefinitions = [
  {
    name: 'join',
    args: 'channelName [private]',
    description: 'Join or create a channel'
  },
  {
    name: 'invite',
    args: 'nickName',
    description: 'Invite a user or restore access'
  },
  {
    name: 'revoke',
    args: 'nickName',
    description: 'Remove a private-channel member (admin)'
  },
  {
    name: 'kick',
    args: 'nickName',
    description: 'Vote to ban a public-channel member'
  },
  { name: 'quit', args: '', description: 'Delete this channel (admin)' },
  { name: 'cancel', args: '', description: 'Leave this channel' },
  { name: 'list', args: '', description: 'Show channel members' },
  { name: 'help', args: '', description: 'Show command help' }
]

// The directory represents the users available in this local prototype.
const knownUsers = channels.value.flatMap(channel => channel.members || [])

export function executeCommand(input, channelName, nickname) {
  const [command, ...args] = input.trim().slice(1).split(/\s+/)
  const definition = commandDefinitions.find(item => item.name === command)
  if (!definition)
    throw new Error('Unknown command. Type /help to see available commands.')
  const expected = ['invite', 'revoke', 'kick'].includes(command) ? 1 : 0
  if (
    command === 'join'
      ? args.length < 1 || args.length > 2 || (args[1] && args[1] !== 'private')
      : args.length !== expected
  ) {
    throw new Error(`Usage: /${command} ${definition.args}`.trim())
  }
  if (command === 'help') return { help: true }
  if (command === 'join') {
    const name = args[0]
    if (!/^[a-z0-9-]+$/.test(name))
      throw new Error(
        'Channel names use lowercase letters, numbers and hyphens.'
      )
    let channel = channels.value.find(item => item.name === name)
    if (channel) {
      if (args[1] && channel.type !== 'private')
        throw new Error('That name already belongs to a public channel.')
      if (channel.banned?.includes(nickname))
        throw new Error('You are banned from this channel.')
      if (channel.type === 'private' && !isJoined(channel) && !channel.invited)
        throw new Error('You need an invitation to join this private channel.')
      if (channel.invited) channel.pinned = true
      channel.invited = false
      channel.left = false
      channel.invitationRead = true
    } else {
      channel = { name, type: args[1] || 'public', isAdmin: true, members: [] }
      channels.value.push(channel)
    }
    return { navigate: name, message: `Joined #${name}.` }
  }
  const channel = channels.value.find(item => item.name === channelName)
  if (!isJoined(channel))
    throw new Error('Join this channel before using this command.')
  if (command === 'list') return { members: true }
  if (command === 'quit' || command === 'cancel') {
    if (command === 'quit' && !channel.isAdmin)
      throw new Error('Only the administrator can delete this channel.')
    if (channel.isAdmin) return { confirmDelete: channel }
    leaveChannel(channel)
    return {
      navigate: channels.value.find(isJoined)?.name || 'general',
      message: `Left #${channel.name}.`
    }
  }
  const target = args[0].replace(/^@/, '')
  if (target === nickname)
    throw new Error('Use /cancel to leave the channel yourself.')
  const member = channel.members?.find(item => item.nick === target)
  if (command === 'invite') {
    if (channel.type === 'private' && !channel.isAdmin)
      throw new Error(
        'Only the administrator can invite users to a private channel.'
      )
    if (channel.banned?.includes(target) && !channel.isAdmin)
      throw new Error(
        'Only the administrator can restore access for a banned user.'
      )
    if (member) throw new Error('This user is already a member.')
    if (!knownUsers.some(user => user.nick === target))
      throw new Error('User not found in the demo directory.')
    channel.banned = (channel.banned || []).filter(nick => nick !== target)
    if (channel.kickVotes) delete channel.kickVotes[target]
    channel.pendingInvites ||= []
    if (channel.pendingInvites.includes(target))
      throw new Error('This user already has a pending invitation.')
    channel.pendingInvites.push(target)
    return { message: `Invitation recorded for @${target}.` }
  }
  if (command === 'revoke' && (channel.type !== 'private' || !channel.isAdmin))
    throw new Error(
      '/revoke is available only to private-channel administrators.'
    )
  if (command === 'kick' && channel.type !== 'public')
    throw new Error('Use /revoke to remove a private-channel member.')
  if (command === 'revoke' && channel.pendingInvites?.includes(target)) {
    channel.pendingInvites = channel.pendingInvites.filter(
      nick => nick !== target
    )
    return { message: `Invitation revoked for @${target}.` }
  }
  if (!member) throw new Error('This user is not a member of this channel.')
  if (member.isAdmin)
    throw new Error('The channel administrator cannot be removed.')
  if (command === 'kick') {
    channel.kickVotes ||= {}
    const voters = (channel.kickVotes[target] ||= [])
    if (!channel.isAdmin) {
      if (voters.includes(nickname))
        throw new Error('You have already voted to kick this user.')
      voters.push(nickname)
      if (voters.length < 3)
        return {
          message: `Kick vote recorded for @${target} (${voters.length}/3).`
        }
    }
    channel.banned ||= []
    channel.banned.push(target)
  }
  channel.members = channel.members.filter(item => item.nick !== target)
  return {
    message: `@${target} ${command === 'kick' ? 'banned' : 'removed'} from #${channel.name}.`
  }
}
