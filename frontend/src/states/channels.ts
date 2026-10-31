import { computed, readonly, ref } from 'vue'
import type { Channel, ChannelPrivacyType } from '../types/channel.ts'
import type { Member } from '../types/member.ts'
import { mockChannels } from '../mock/channels.ts'
import { useAuth } from './auth.ts'
import { useUsers } from './users.ts'
import { useMessages } from './messages.ts'
import { useDrafts } from './drafts.ts'

const channels = ref<Channel[]>(structuredClone(mockChannels))

// kick votes <channelID, userID>
const kickVotes = ref<Record<string, number[]>>({})
const KICK_VOTES_TO_BAN = 3 // minimum to kick

// Deconstrunting
const { profile, isLoggedIn } = useAuth()
const { getById: getUserById } = useUsers()
const { removeChannel: removeChannelMessages } = useMessages()

const myId = () => profile.value.id

// intern functions for easier changing - not exporting

function find(channelId: number) {
  return channels.value.find(c => c.id === channelId)
}

function findOrThrow(channelId: number) {
  const channel = find(channelId)
  if (!channel) throw new Error('Channel not found.')
  return channel
}

function requireMember(channelId: number) {
  const channel = findOrThrow(channelId)
  if (!isJoined(channelId))
    throw new Error('Join this channel before using this action.')
  return channel
}

function requireAdmin(channelId: number) {
  const channel = requireMember(channelId)
  if (!isAdmin(channelId))
    throw new Error('Only the channel administrator can do this.')
  return channel
}

function requireTarget(channel: Channel, userId: number) {
  if (userId === myId())
    throw new Error('Use /cancel to leave the channel yourself.')
  if (userId === channel.adminId)
    throw new Error('The channel administrator cannot be removed.')
  if (!channel.memberIds.includes(userId))
    throw new Error('This user is not a member of this channel.')
}

// getters

const joinedChannels = computed(() =>
  channels.value
    .filter(c => isJoined(c.id))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned))
)

const invitations = computed(() => channels.value.filter(c => c.invited))

const hasUnreadInvitations = computed(() =>
  invitations.value.some(c => !c.invitationRead)
)

function getById(channelId: number) {
  const channel = find(channelId)
  return channel ? readonly(channel) : undefined
}

function getByName(name: string) {
  const channel = channels.value.find(c => c.name === name)
  return channel ? readonly(channel) : undefined
}

function isJoined(channelId: number) {
  const channel = find(channelId)
  return (
    isLoggedIn.value &&
    !!channel?.memberIds.includes(myId()) &&
    !channel.bannedIds.includes(myId())
  )
}

function isAdmin(channelId: number) {
  return find(channelId)?.adminId === myId()
}

function membersOf(channelId: number) {
  const channel = find(channelId)
  if (!channel || !isJoined(channelId)) return []
  return channel.memberIds
    .map(id => getUserById(id))
    .filter((member): member is Readonly<Member> => member !== undefined)
}

// actions

function create(name: string, type: ChannelPrivacyType) {
  if (!isLoggedIn.value) throw new Error('Log in first.')
  if (!/^[a-z0-9-]+$/.test(name))
    throw new Error(
      'Use lowercase letters, numbers and hyphens for channel names.'
    )
  if (getByName(name)) throw new Error('This channel already exists.')
  const channel: Channel = {
    id: Math.max(0, ...channels.value.map(c => c.id)) + 1,
    name,
    type,
    adminId: myId(),
    memberIds: [myId()],
    bannedIds: [],
    invited: false,
    invitationRead: true,
    pinned: false,
    unreadCount: 0
  }
  channels.value.push(channel)
  return channel.id
}

function join(channelId: number) {
  const channel = findOrThrow(channelId)
  if (!isLoggedIn.value) throw new Error('Log in first.')
  if (channel.bannedIds.includes(myId()))
    throw new Error('You are banned from this channel.')
  if (channel.type === 'private' && !isJoined(channelId) && !channel.invited)
    throw new Error('You need an invitation to join this private channel.')
  if (!channel.memberIds.includes(myId())) channel.memberIds.push(myId())
  if (channel.invited) {
    channel.invited = false
    channel.invitationRead = true
    channel.pinned = true // invitation will show up
  }
}

function remove(channelId: number) {
  const channel = requireAdmin(channelId)
  useDrafts().remove(channel.name)
  channels.value = channels.value.filter(c => c.id !== channelId)
  removeChannelMessages(channelId)
  for (const key of Object.keys(kickVotes.value)) {
    if (key.startsWith(`${channelId}:`)) delete kickVotes.value[key]
  }
}

// Admin odchodom kanál zruší, ostatní z neho len odídu.
function leave(channelId: number) {
  const channel = requireMember(channelId)
  useDrafts().remove(channel.name)
  if (channel.adminId === myId()) {
    remove(channelId)
    return
  }
  channel.memberIds = channel.memberIds.filter(id => id !== myId())
  channel.pinned = false
}

function acceptInvitation(channelId: number) {
  join(channelId)
}

function declineInvitation(channelId: number) {
  const channel = findOrThrow(channelId)
  channel.invited = false
  channel.invitationRead = true
}

function markInvitationsRead() {
  invitations.value.forEach(c => (c.invitationRead = true))
}

function markRead(channelId: number) {
  const channel = find(channelId)
  if (channel) channel.unreadCount = 0
}

function togglePin(channelId: number) {
  const channel = requireMember(channelId)
  channel.pinned = !channel.pinned
}

// user will be added automatically
function invite(channelId: number, userId: number) {
  const channel = requireMember(channelId)
  if (!getUserById(userId)) throw new Error('User not found.')
  if (channel.type === 'private' && !isAdmin(channelId))
    throw new Error(
      'Only the administrator can invite users to a private channel.'
    )
  if (channel.bannedIds.includes(userId) && !isAdmin(channelId))
    throw new Error('Only the administrator can restore a banned user.')
  if (channel.memberIds.includes(userId))
    throw new Error('This user is already a member.')
  channel.bannedIds = channel.bannedIds.filter(id => id !== userId)
  delete kickVotes.value[`${channelId}:${userId}`]
  if (!channel.memberIds.includes(userId)) channel.memberIds.push(userId)
}

function revoke(channelId: number, userId: number) {
  const channel = requireAdmin(channelId)
  if (channel.type !== 'private')
    throw new Error('/revoke works only in private channels.')
  requireTarget(channel, userId)
  channel.memberIds = channel.memberIds.filter(id => id !== userId)
}

function ban(channel: Channel, userId: number) {
  channel.memberIds = channel.memberIds.filter(id => id !== userId)
  if (!channel.bannedIds.includes(userId)) channel.bannedIds.push(userId)
  delete kickVotes.value[`${channel.id}:${userId}`]
}

// admin bans immidiately
function kick(channelId: number, userId: number) {
  const channel = requireMember(channelId)
  if (channel.type !== 'public')
    throw new Error('/kick works only in public channels.')
  requireTarget(channel, userId)

  if (channel.adminId === myId()) {
    ban(channel, userId)
    return { banned: true, votes: KICK_VOTES_TO_BAN }
  }

  const key = `${channelId}:${userId}`

  if (kickVotes.value[key] === undefined) {
    // no votes
    kickVotes.value[key] = [] // create empty votes array
  }

  const voters = kickVotes.value[key]

  if (voters.includes(myId())) {
    // already voted
    throw new Error('You have already voted to kick this user.')
  }
  voters.push(myId())

  const votes = voters.length
  if (votes >= KICK_VOTES_TO_BAN) {
    ban(channel, userId)
  }
  return { banned: votes >= KICK_VOTES_TO_BAN, votes }
}

// export public functions
export function useChannels() {
  return {
    channels: readonly(channels),
    joinedChannels: readonly(joinedChannels),
    invitations: readonly(invitations),
    hasUnreadInvitations,
    getById,
    getByName,
    isJoined,
    isAdmin,
    membersOf,
    create,
    join,
    leave,
    remove,
    acceptInvitation,
    declineInvitation,
    markInvitationsRead,
    markRead,
    togglePin,
    invite,
    revoke,
    kick
  }
}
