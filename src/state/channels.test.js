import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { channels, executeCommand, isJoined, leaveChannel } from './channels.js'

const initial = JSON.parse(JSON.stringify(channels.value))
beforeEach(() => {
  channels.value = JSON.parse(JSON.stringify(initial))
})
const run = (input, channel = 'general', actor = 'jozko') =>
  executeCommand(input, channel, actor)

test('validates unknown commands and arguments without creating channels', () => {
  for (const input of [
    '/unknown',
    '/join',
    '/join bad/name',
    '/join room public',
    '/list extra',
    '/invite'
  ]) {
    assert.throws(() => run(input))
  }
  assert.equal(channels.value.length, initial.length)
})

test('creates a private channel with admin rights and does not duplicate it', () => {
  run('/join study private')
  run('/join study private')
  const matches = channels.value.filter(channel => channel.name === 'study')
  assert.equal(matches.length, 1)
  assert.equal(matches[0].type, 'private')
  assert.equal(matches[0].isAdmin, true)
})

test('accepts and pins invitations, but rejects private access without invitation', () => {
  const channel = channels.value[0]
  assert.equal(isJoined(channel), false)
  run('/join project-invitation')
  assert.equal(channel.pinned, true)
  assert.equal(isJoined(channel), true)
  leaveChannel(channel)
  assert.throws(() => run('/join project-invitation'), /invitation/)
  assert.throws(() => run('/list', channel.name), /Join this channel/)
})

test('leaving a public channel allows rejoining; admin deletion requires confirmation', () => {
  run('/cancel')
  assert.equal(
    isJoined(channels.value.find(channel => channel.name === 'general')),
    false
  )
  run('/join general')
  assert.equal(
    isJoined(channels.value.find(channel => channel.name === 'general')),
    true
  )
  assert.throws(() => run('/quit'), /administrator/)
  const result = run('/cancel', 'vpwa-team')
  assert.equal(result.confirmDelete.name, 'vpwa-team')
  assert.ok(channels.value.includes(result.confirmDelete))
  leaveChannel(result.confirmDelete)
  assert.equal(
    channels.value.some(channel => channel.name === 'vpwa-team'),
    false
  )
})

test('public kick votes must be distinct; third vote bans and only admin restores access', () => {
  assert.match(run('/kick alice').message, /1\/3/)
  assert.throws(() => run('/kick alice'), /already voted/)
  assert.match(run('/kick alice', 'general', 'bob').message, /2\/3/)
  assert.match(
    run('/kick alice', 'general', 'another-member').message,
    /banned/
  )
  const channel = channels.value.find(item => item.name === 'general')
  assert.ok(channel.banned.includes('alice'))
  assert.equal(
    channel.members.some(member => member.nick === 'alice'),
    false
  )
  assert.throws(() => run('/join general', 'general', 'alice'), /banned/)
  assert.throws(() => run('/invite alice'), /administrator/)
  channel.isAdmin = true
  run('/invite alice')
  assert.equal(channel.banned.includes('alice'), false)
  assert.ok(channel.pendingInvites.includes('alice'))
})

test('private revoke and invite enforce permissions and handle pending invitations', () => {
  assert.throws(() => run('/revoke alice'), /private-channel administrators/)
  assert.throws(() => run('/kick ida', 'vpwa-team'), /revoke/)
  run('/revoke ida', 'vpwa-team')
  run('/invite ida', 'vpwa-team')
  assert.throws(() => run('/invite ida', 'vpwa-team'), /pending invitation/)
  run('/revoke ida', 'vpwa-team')
  const channel = channels.value.find(item => item.name === 'vpwa-team')
  assert.deepEqual([...channel.pendingInvites], [])
  channel.isAdmin = false
  assert.throws(() => run('/invite alice', 'vpwa-team'), /administrator/)
})

test('admin kick is immediate and administrators cannot be kicked', () => {
  assert.throws(() => run('/kick cyprian'), /administrator/)
  channels.value.find(item => item.name === 'general').isAdmin = true
  assert.match(run('/kick bob').message, /banned/)
})
