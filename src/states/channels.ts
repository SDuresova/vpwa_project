import { computed, readonly, ref } from 'vue'
import type { Channel, ChannelPrivacyType } from '../types/channel'
import type { Member } from '../types/member'
import { mockChannels } from '../mock/channels'
import { useAuth } from './auth'
import { useUsers } from './users'
import { useMessages } from './messages'

const channels = ref<Channel[]>(structuredClone(mockChannels))

// kick votes <channelID, userID>
const kickVotes = ref<Record<string, number[]>>({})
const KICK_VOTES_TO_BAN = 3 // minimum to kick


// Deconstrunting
const { profile } = useAuth()
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

// getters

const joinedChannels = computed(() =>
  channels.value
    .filter(c => c.memberIds.includes(myId()))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned))
)

const invitations = computed(() => channels.value.filter(c => c.invited))

const hasUnreadInvitations = computed(() => invitations.value.some(c => !c.invitationRead))

function getById(channelId: number) {
  const channel = find(channelId)
  return channel ? readonly(channel) : undefined
}

function getByName(name: string) {
  const channel = channels.value.find(c => c.name === name)
  return channel ? readonly(channel) : undefined
}

function isJoined(channelId: number) {
  return find(channelId)?.memberIds.includes(myId()) ?? false
}

function isAdmin(channelId: number) {
  return find(channelId)?.adminId === myId()
}

function membersOf(channelId: number) {
  const channel = find(channelId)
  if (!channel) return []
  return channel.memberIds
    .map(id => getUserById(id))
    .filter((member): member is Readonly<Member> => member !== undefined)
}

// actions

function create(name: string, type: ChannelPrivacyType) {
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
  if (!channel.memberIds.includes(myId())) channel.memberIds.push(myId())
  if (channel.invited) {
    channel.invited = false
    channel.invitationRead = true
    channel.pinned = true // invitation will show up
  }
}

function remove(channelId: number) {
  channels.value = channels.value.filter(c => c.id !== channelId)
  removeChannelMessages(channelId) 
}

// Admin odchodom kanál zruší, ostatní z neho len odídu.
function leave(channelId: number) {
  const channel = findOrThrow(channelId)
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

// user will be added automatically
function invite(channelId: number, userId: number) {
  const channel = findOrThrow(channelId)
  channel.bannedIds = channel.bannedIds.filter(id => id !== userId)
  delete kickVotes.value[`${channelId}:${userId}`]
  if (!channel.memberIds.includes(userId)) channel.memberIds.push(userId)
}

function revoke(channelId: number, userId: number) {
  const channel = findOrThrow(channelId)
  channel.memberIds = channel.memberIds.filter(id => id !== userId)
}

function ban(channel: Channel, userId: number) {
  channel.memberIds = channel.memberIds.filter(id => id !== userId)
  if (!channel.bannedIds.includes(userId)) channel.bannedIds.push(userId)
  delete kickVotes.value[`${channel.id}:${userId}`]
}

// admin bans immidiately 
function kick(channelId: number, userId: number) {
  const channel = findOrThrow(channelId)

  if (channel.adminId === myId()) {
    ban(channel, userId)
    return { banned: true, votes: KICK_VOTES_TO_BAN }
  }

    const key = `${channelId}:${userId}`

    if (kickVotes.value[key] === undefined) {   // no votes
        kickVotes.value[key] = []                 // create empty votes array
    }

    const voters = kickVotes.value[key]     

    if (voters.includes(myId())) {              // already voted
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
    invite,
    revoke,
    kick
  }
}