import type { Channel } from '../types/channel.ts'

export const mockChannels: Channel[] = [
  {
    id: 1,
    name: 'general',
    type: 'public',
    adminId: 4, // cyprian
    memberIds: [1, 2, 3, 4, 8],
    bannedIds: [],
    invited: false,
    invitationRead: true,
    pinned: false,
    unreadCount: 3
  },
  {
    id: 2,
    name: 'random',
    type: 'public',
    adminId: 5, // david
    memberIds: [1, 5, 6],
    bannedIds: [],
    invited: false,
    invitationRead: true,
    pinned: false,
    unreadCount: 0
  },
  {
    id: 3,
    name: 'vpwa-team',
    type: 'private',
    adminId: 1, // jozko (ty)
    memberIds: [1, 7],
    bannedIds: [],
    invited: false,
    invitationRead: true,
    pinned: false,
    unreadCount: 1
  },
  {
    id: 4,
    name: 'project-invitation',
    type: 'private',
    adminId: 7, // ida
    memberIds: [7],
    bannedIds: [],
    invited: true,
    invitationRead: false,
    pinned: false,
    unreadCount: 0
  }
]
