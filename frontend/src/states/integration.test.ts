import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseCommand } from '../commands/parser.ts'
import { shouldNotify } from './notifications.ts'

test('notification preferences, visibility, presence and mentions', () => {
  const message = {
    id: 999999,
    channelId: 1,
    authorId: 2,
    content: 'Hello',
    createdAt: new Date().toISOString(),
    mentionedUsers: [] as number[]
  }
  const context = {
    userId: 1,
    status: 'online' as const,
    joined: true,
    visible: false
  }
  assert.equal(shouldNotify(message, context, 'all'), true)
  assert.equal(shouldNotify(message, context, 'nothing'), false)
  assert.equal(shouldNotify(message, context, 'mentions'), false)
  assert.equal(
    shouldNotify({ ...message, mentionedUsers: [1] }, context, 'mentions'),
    true
  )
  assert.equal(
    shouldNotify(message, { ...context, visible: true }, 'all'),
    false
  )
  assert.equal(
    shouldNotify(message, { ...context, status: 'dnd' }, 'all'),
    false
  )
  assert.equal(
    shouldNotify(message, { ...context, status: 'offline' }, 'all'),
    false
  )
  assert.equal(
    shouldNotify(message, { ...context, joined: false }, 'all'),
    false
  )
  assert.equal(shouldNotify({ ...message, authorId: 1 }, context, 'all'), false)
})

test('command grammar validates every required command', () => {
  assert.deepEqual(parseCommand('/join study private'), { name: 'join', args: ['study', 'private'] })
  for (const command of ['/join study', '/invite alice', '/revoke alice', '/kick alice', '/quit', '/cancel', '/help', '/list']) assert.ok(parseCommand(command))
  for (const input of ['join study', '/nope', '/join', '/join study secret', '/list extra', '/invite']) assert.throws(() => parseCommand(input))
})
