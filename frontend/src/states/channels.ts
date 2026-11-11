import { computed, readonly } from 'vue'
import { channelData, invitationData, act } from './chat'
import { useAuth } from './auth'
import { useUsers } from './users'
import { useDrafts } from './drafts'
import type { ChannelPrivacyType } from '../types/channel'

const find = (id: number) => channelData.value.find(c => c.id === id)
const isJoined = (id: number) => !!find(id)?.memberIds.includes(useAuth().profile.value.id)
const isAdmin = (id: number) => find(id)?.adminId === useAuth().profile.value.id
const joinedChannels = computed(() => channelData.value.filter(c => isJoined(c.id)).sort((a,b) =>
  Number(b.invited) - Number(a.invited) || Number(b.pinned) - Number(a.pinned) || a.name.localeCompare(b.name)))
const invitations = computed(() => invitationData.value)
const hasUnreadInvitations = computed(() => invitations.value.some(c => !c.invitationRead))
async function leave(id: number, action = 'cancel') {
  const name = find(id)?.name
  await act(action, id)
  if (name) useDrafts().remove(name)
}
export function useChannels() {
  return {
    channels: readonly(channelData), joinedChannels: readonly(joinedChannels),
    invitations: readonly(invitations), hasUnreadInvitations,
    getById: find, getByName: (name: string) => channelData.value.find(c => c.name === name),
    isJoined, isAdmin,
    membersOf: (id: number) => useUsers().users.value.filter(u => find(id)?.memberIds.includes(u.id)),
    create: async (name: string, type: ChannelPrivacyType) => (await act('create', undefined, [name, type])).navigateTo!,
    join: async (id: number) => act('join', undefined, [find(id)?.name || '']),
    leave: (id: number) => leave(id),
    remove: (id: number) => leave(id, 'quit'),
    acceptInvitation: (id: number) => act('accept', id),
    declineInvitation: (id: number) => leave(id, 'decline'),
    markInvitationsRead: async () => {
      for (const channel of invitations.value.filter(c => !c.invitationRead)) await act('read', channel.id)
    },
    markRead: (_id: number) => {},
    togglePin: (id: number) => act('pin', id),
    invite: (id: number, userId: number) => act('invite', id, [useUsers().getById(userId)?.nickname || '']),
    revoke: (id: number, userId: number) => act('revoke', id, [useUsers().getById(userId)?.nickname || '']),
    kick: (id: number, userId: number) => act('kick', id, [useUsers().getById(userId)?.nickname || ''])
  }
}
