import assert from 'node:assert/strict'
import { test } from 'node:test'
import { useAuth } from './auth.ts'
import { useChannels } from './channels.ts'
import { useMessages } from './messages.ts'
import { useUsers } from './users.ts'
import { executeCommand } from '../commands/execute.ts'
import { parseCommand } from '../commands/parser.ts'
import { shouldNotify } from './notifications.ts'

test('notification preferences, visibility, presence and incoming delivery', () => {
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
  const auth = useAuth()
  auth.login('jozko')
  const messages = useMessages()
  let deliveries = 0
  const unsubscribe = messages.onIncoming(() => deliveries++)
  messages.receive(message)
  messages.receive(message)
  assert.equal(deliveries, 1)
  unsubscribe()
  auth.logout()
})

test('TypeScript chat integration', async t => {
  const auth = useAuth()
  const channels = useChannels()
  const messages = useMessages()
  const users = useUsers()
  const run = (input: string, channelId: number | null = 1) =>
    executeCommand(input, { channelId })

  await t.test('login, profile and presence share one user directory', () => {
    assert.equal(auth.isLoggedIn.value, false)
    assert.throws(() => messages.send(1, 'No access'), /Join/)
    auth.login('jozko')
    auth.updateProfile({
      firstName: 'Sara',
      lastName: 'Tester',
      email: 'sara@example.com'
    })
    auth.setStatus('dnd')
    assert.equal(users.getById(1)?.status, 'dnd')
    assert.equal(auth.fullName.value, 'Sara Tester')
    assert.equal(auth.profile.value.email, 'sara@example.com')
    assert.throws(() => auth.updateProfile({ nickname: 'alice' }), /taken/)
    auth.setStatus('online')
  })

  await t.test(
    'parser validates command names, argument counts and allowed values',
    () => {
      assert.deepEqual(parseCommand('/join study private'), {
        name: 'join',
        args: ['study', 'private']
      })
      for (const input of [
        'join study',
        '/nope',
        '/join',
        '/join study secret',
        '/list extra',
        '/invite'
      ])
        assert.throws(() => parseCommand(input))
      assert.deepEqual(run('/help', null), { showHelp: true })
      assert.deepEqual(run('/list'), { showMembers: true })
    }
  )

  await t.test(
    'invitation acceptance pins, unpin works, private access needs an invitation',
    () => {
      assert.equal(channels.isJoined(4), false)
      assert.equal(messages.forChannel(4).length, 0)
      channels.acceptInvitation(4)
      assert.equal(channels.joinedChannels.value[0]?.id, 4)
      channels.togglePin(4)
      assert.equal(channels.getById(4)?.pinned, false)
      channels.leave(4)
      assert.throws(() => run('/join project-invitation'), /invitation/)
      assert.throws(() => channels.togglePin(4), /Join/)
      assert.throws(() => messages.send(4, 'Hidden'), /Join/)
    }
  )

  await t.test(
    'messages use user IDs, parse mentions once, and survive profile edits',
    () => {
      const sent = messages.send(1, 'Hello @alice, and @alice!')
      assert.equal(sent.authorId, 1)
      assert.deepEqual([...sent.mentionedUsers], [2])
      auth.updateProfile({ nickname: 'sara' })
      assert.equal(users.getById(sent.authorId)?.nickname, 'sara')
      assert.throws(() => messages.send(1, '   '), /Enter/)
      auth.updateProfile({ nickname: 'jozko' })
    }
  )

  await t.test(
    'create, invite, revoke and delete share state and clean message history',
    () => {
      const result = run('/join study private')
      const id = result.navigateTo!
      assert.equal(channels.isAdmin(id), true)
      assert.throws(() => channels.create('study', 'public'), /exists/)
      run('/invite alice', id)
      assert.ok(channels.membersOf(id).some(user => user.id === 2))
      run('/revoke alice', id)
      assert.equal(
        channels.membersOf(id).some(user => user.id === 2),
        false
      )
      messages.send(id, 'Delete with the channel')
      assert.deepEqual(run('/quit', id), { confirmDelete: id })
      assert.ok(channels.getById(id))
      channels.remove(id)
      const replacement = channels.create('study', 'private')
      assert.equal(messages.forChannel(replacement).length, 0)
      assert.deepEqual(run('/cancel', replacement), {
        confirmDelete: replacement
      })
      channels.remove(replacement)
    }
  )

  await t.test(
    'permissions reject non-admin actions, duplicate votes and admin removal',
    () => {
      assert.throws(() => run('/quit'), /administrator/)
      assert.throws(() => channels.remove(1), /administrator/)
      assert.throws(() => run('/revoke alice'), /administrator/)
      assert.throws(() => run('/kick ida', 3), /public/)
      assert.throws(() => run('/kick cyprian'), /administrator/)
      assert.match(run('/kick alice').message!, /1\/3/)
      assert.throws(() => run('/kick alice'), /already voted/)
      const id = channels.create('moderation', 'public')
      run('/invite alice', id)
      run('/kick alice', id)
      assert.ok(channels.getById(id)?.bannedIds.includes(2))
      run('/invite alice', id)
      assert.equal(channels.getById(id)?.bannedIds.includes(2), false)
      assert.ok(channels.membersOf(id).some(user => user.id === 2))
      channels.remove(id)
    }
  )

  await t.test('leaving hides messages and members until rejoining', () => {
    run('/cancel', 2)
    assert.equal(channels.isJoined(2), false)
    assert.equal(channels.membersOf(2).length, 0)
    assert.equal(messages.forChannel(2).length, 0)
    run('/join random')
    assert.ok(messages.forChannel(2).length)
  })

  await t.test('logout disables sending and clears visible memberships', () => {
    auth.logout()
    assert.equal(auth.isLoggedIn.value, false)
    assert.equal(users.getById(1)?.status, 'offline')
    assert.equal(channels.joinedChannels.value.length, 0)
    assert.throws(() => messages.send(1, 'No access'), /Join/)
    assert.throws(() => run('/join general'), /Log in/)
  })
})
