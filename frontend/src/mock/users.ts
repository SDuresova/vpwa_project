import type { Profile } from '../types/profile.ts'
import type { Member } from '../types/member.ts'

// demo user
export const mockProfile: Profile = {
  id: 1,
  firstName: 'jozko',
  email: '',
  lastName: 'ferko',
  nickname: 'jozko',
  status: 'online'
}

// fake members
export const mockUsers: Member[] = [
  { id: 1, nickname: 'jozko', status: 'online' },
  { id: 2, nickname: 'alice', status: 'online' },
  { id: 3, nickname: 'bob', status: 'dnd' },
  { id: 4, nickname: 'cyprian', status: 'offline' },
  { id: 5, nickname: 'david', status: 'online' },
  { id: 6, nickname: 'fabio', status: 'dnd' },
  { id: 7, nickname: 'ida', status: 'online' },
  { id: 8, nickname: 'ed', status: 'offline' }
]
