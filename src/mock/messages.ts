import type { Message } from '../types/message'

export const mockMessages: Record<number, Message[]> = {
  1: [
    {
      id: 1,
      channelId: 1,
      authorId: 2,
      content: 'Hey everyone! Welcome to our little corner of the internet.',
      createdAt: '2026-10-12T12:02:00.000Z',
      mentionedUsers: []
    },
    {
      id: 2,
      channelId: 1,
      authorId: 1,
      content: 'Happy to be here! 🌿',
      createdAt: '2026-10-12T12:05:00.000Z',
      mentionedUsers: []
    },
    {
      id: 3,
      channelId: 1,
      authorId: 8,
      content: 'A fresh space for ideas, questions and everything in between. @jozko',
      createdAt: '2026-10-12T12:06:00.000Z',
      mentionedUsers: [1]
    }
  ],
  2: [
    {
      id: 4,
      channelId: 2,
      authorId: 5,
      content: 'What is everyone working on today?',
      createdAt: '2026-10-12T12:10:00.000Z',
      mentionedUsers: []
    }
  ],
  3: [
    {
      id: 5,
      channelId: 3,
      authorId: 7,
      content: 'Let’s use this channel to plan our project.',
      createdAt: '2026-10-12T12:12:00.000Z',
      mentionedUsers: []
    }
  ],
  4: []
}