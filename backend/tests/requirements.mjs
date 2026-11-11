import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createConnection } from 'mysql2/promise'

process.loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)))
if (process.env.NODE_ENV !== 'development') throw new Error('Run only against the local development database.')
const base = 'http://localhost:' + (process.env.PORT || 3333) + '/api/v1'
const sql = await createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD || '', database: process.env.DB_DATABASE,
})
const prefix = 'qa' + Date.now().toString(36)
const users = []
const createdIds = []
let checks = 0
const check = (value, label) => { assert.ok(value, label); checks++; console.log('PASS ' + label) }
async function request(path, token, body, method = body ? 'POST' : 'GET', expected = 200) {
  const response = await fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  })
  const data = await response.json()
  assert.equal(response.status, expected, path + ': ' + JSON.stringify(data))
  return data
}
const snapshot = user => request('/chat', user.token)
const action = (user, name, channelId, args = [], expected = 200) =>
  request('/chat/action', user.token, { action: name, channelId, args }, 'POST', expected)
try {
  await request('/chat', undefined, undefined, 'GET', 401)
  check(true, 'anonymous access is rejected')
  for (let i = 0; i < 6; i++) {
    const nickname = prefix + i
    const input = { firstName: 'Test', lastName: 'Person', nickname, email: nickname + '@example.com', password: 'TestPassword123!' }
    const registered = await request('/auth/signup', undefined, input)
    createdIds.push(registered.user.id)
    const logged = await request('/auth/login', undefined, { nickname, password: input.password })
    users.push({ ...logged.user, token: logged.token, input })
    assert.deepEqual(logged.user, registered.user)
  }
  const [admin, first, second, third, target, outsider] = users
  check(admin.firstName === 'Test' && admin.lastName === 'Person' && !!admin.email && !!admin.nickname, 'registration and login return all profile fields')
  await request('/auth/login', undefined, { nickname: admin.nickname, password: 'wrong' }, 'POST', 400)
  check(true, 'incorrect password is rejected')
  await request('/auth/signup', undefined, { ...admin.input, email: prefix + 'other@example.com' }, 'POST', 422)
  check(true, 'duplicate nickname is rejected')
  const profile = await request('/account/profile', admin.token)
  check(profile.id === admin.id, 'authentication survives a fresh request')
  const pubName = prefix + '-public'
  const pub = (await action(admin, 'join', undefined, [pubName])).navigateTo
  let state = await snapshot(admin)
  check(state.channels.find(c => c.id === pub)?.adminId === admin.id, '/join creates a public channel owned by its creator')
  await action(first, 'create', undefined, [pubName, 'private'], 409)
  check(true, 'channel names are unique across public and private channels')
  const concurrent = await Promise.all([first, second, third].map(user => action(user, 'join', undefined, [prefix + '-concurrent'])))
  check(new Set(concurrent.map(result => result.navigateTo)).size === 1, 'simultaneous joins create one shared channel')
  for (const user of [first, second, third, target]) await action(user, 'join', undefined, [pubName])
  check((await snapshot(target)).channels.some(c => c.id === pub), 'any user can join a public channel')
  check(!(await snapshot(outsider)).channels.some(c => c.id === pub), 'channel list contains only memberships')
  await request('/chat/messages', outsider.token, { channelId: pub, content: 'forbidden' }, 'POST', 403)
  await action(outsider, 'invite', pub, [outsider.nickname], 403)
  check(true, 'nonmembers cannot send or invite')
  await action(first, 'invite', pub, [outsider.nickname])
  let invited = (await snapshot(outsider)).invitations.find(c => c.id === pub)
  check(invited?.invited && invited?.pinned && !invited?.invitationRead, 'public invitation is pending in the inbox')
  check(!(await snapshot(outsider)).channels.some(c => c.id === pub), 'pending channel is absent from channel list')
  check(!(await snapshot(admin)).channels.find(c => c.id === pub).memberIds.includes(outsider.id), 'pending user is absent from member list')
  await request('/chat/messages', admin.token, { channelId: pub, content: 'Before acceptance @' + outsider.nickname })
  const pendingState = await snapshot(outsider)
  check(!pendingState.messages.some(m => m.channelId === pub) && pendingState.invitations[0].memberIds.length === 0, 'pending user cannot read history or members')
  check(!(await snapshot(admin)).messages.find(m => m.content.startsWith('Before acceptance')).mentionedUsers.includes(outsider.id), 'pending user is not a mention recipient')
  for (const name of ['pin', 'invite', 'kick', 'quit', 'cancel']) await action(outsider, name, pub, [first.nickname], 403)
  await action(outsider, 'join', undefined, [pubName], 403)
  await request('/chat/messages', outsider.token, { channelId: pub, content: 'pending' }, 'POST', 403)
  await action(first, 'invite', pub, [outsider.nickname], 409)
  check(true, 'pending invitation grants no member actions and cannot be bypassed by join')
  await action(outsider, 'read', pub)
  check(!(await snapshot(outsider)).channels.some(c => c.id === pub), 'reading inbox does not accept invitation')
  await action(outsider, 'accept', pub)
  invited = (await snapshot(outsider)).channels.find(c => c.id === pub)
  check(!invited.invited && invited.pinned && invited.invitationRead, 'accepted channel appears pinned and persists')
  check((await snapshot(admin)).channels.find(c => c.id === pub).memberIds.includes(outsider.id), 'accepted user now appears in member list')
  check(!(await snapshot(outsider)).invitations.some(c => c.id === pub), 'acceptance removes inbox invitation')
  await action(outsider, 'accept', pub, [], 409)
  await request('/chat/messages', admin.token, { channelId: pub, content: 'Hello @' + target.nickname + ', @' + target.nickname + '!' })
  state = await snapshot(target)
  check(state.messages.some(m => m.channelId === pub && m.mentionedUsers.length === 1 && m.mentionedUsers[0] === target.id), 'messages persist and resolve unique mention recipient IDs')
  const [dbMessages] = await sql.execute('SELECT id FROM messages WHERE channel_id = ?', [pub])
  check(dbMessages.length === 2, 'messages are stored in MariaDB')
  await action(first, 'quit', pub, [], 403)
  await action(first, 'kick', pub, [admin.nickname], 400)
  check(true, 'members cannot delete channels or remove administrator')
  assert.equal((await action(first, 'kick', pub, [target.nickname])).votes, 1)
  await action(first, 'kick', pub, [target.nickname], 409)
  assert.equal((await action(second, 'kick', pub, [target.nickname])).votes, 2)
  check((await snapshot(target)).channels.some(c => c.id === pub), 'two distinct votes do not ban; duplicate votes are rejected')
  assert.equal((await action(third, 'kick', pub, [target.nickname])).banned, true)
  check(!(await snapshot(target)).channels.some(c => c.id === pub), 'three distinct member votes remove channel from target list')
  await action(target, 'join', undefined, [pubName], 403)
  await request('/chat/messages', target.token, { channelId: pub, content: 'banned' }, 'POST', 403)
  await action(first, 'invite', pub, [target.nickname], 403)
  check(true, 'ban prevents rejoining, sending, and nonadmin restoration')
  await action(admin, 'invite', pub, [target.nickname])
  check((await snapshot(target)).invitations.some(c => c.id === pub), 'administrator restoration requires invitation acceptance')
  await action(target, 'accept', pub)
  check((await snapshot(target)).channels.some(c => c.id === pub), 'administrator invitation restores member after acceptance')
  assert.equal((await action(admin, 'kick', pub, [target.nickname])).banned, true)
  check(!(await snapshot(target)).channels.some(c => c.id === pub), 'administrator bans immediately')
  await action(first, 'cancel', pub)
  check(!(await snapshot(first)).channels.some(c => c.id === pub), '/cancel removes ordinary membership')
  const privateName = prefix + '-private'
  const privateId = (await action(admin, 'join', undefined, [privateName, 'private'])).navigateTo
  await action(first, 'join', undefined, [privateName], 403)
  await action(admin, 'invite', privateId, [first.nickname])
  await action(first, 'invite', privateId, [second.nickname], 403)
  await action(first, 'join', undefined, [privateName], 403)
  await request('/chat/messages', first.token, { channelId: privateId, content: 'pending private' }, 'POST', 403)
  check(!(await snapshot(first)).channels.some(c => c.id === privateId), 'private invitation also stays out of channel list')
  await action(first, 'accept', privateId)
  await action(first, 'revoke', privateId, [admin.nickname], 400)
  await action(admin, 'kick', privateId, [first.nickname], 400)
  await action(admin, 'revoke', privateId, [first.nickname])
  check(!(await snapshot(first)).channels.some(c => c.id === privateId), 'private channels enforce administrator-only invite/revoke')
  await action(first, 'join', undefined, [privateName], 403)
  await action(admin, 'invite', privateId, [first.nickname])
  await action(first, 'decline', privateId)
  check(!(await snapshot(first)).channels.some(c => c.id === privateId) && !(await snapshot(first)).invitations.some(c => c.id === privateId), 'declining invitation grants no membership and removes inbox entry')
  await action(first, 'accept', privateId, [], 403)
  await action(admin, 'invite', privateId, [first.nickname])
  await action(admin, 'revoke', privateId, [first.nickname])
  await action(first, 'accept', privateId, [], 403)
  check(!(await snapshot(first)).invitations.some(c => c.id === privateId), 'revoked pending invitation cannot be accepted')
  await action(admin, 'cancel', privateId)
  check(!(await snapshot(admin)).channels.some(c => c.id === privateId), 'administrator /cancel deletes channel')
  const recreated = (await action(first, 'join', undefined, [privateName])).navigateTo
  check(recreated !== privateId, 'deleted channel name can be reused')
  await action(first, 'quit', recreated)
  const idleName = prefix + '-idle'
  const idle = (await action(admin, 'join', undefined, [idleName])).navigateTo
  await sql.execute('UPDATE channels SET last_message_at = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 31 DAY) WHERE id = ?', [idle])
  check(!(await snapshot(admin)).channels.some(c => c.id === idle), '30-day inactive channel expires')
  const reused = (await action(first, 'join', undefined, [idleName])).navigateTo
  check(reused !== idle, 'expired channel name can be reused')
  await sql.execute('UPDATE channels SET last_message_at = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 29 DAY) WHERE id = ?', [reused])
  await request('/chat/messages', first.token, { channelId: reused, content: 'Keep active' })
  const [activeRows] = await sql.execute('SELECT TIMESTAMPDIFF(SECOND, last_message_at, UTC_TIMESTAMP()) AS age FROM channels WHERE id = ?', [reused])
  check(activeRows[0].age < 10, 'new message renews channel activity')
  const updated = await request('/account/profile', admin.token, { ...profile, firstName: 'Updated' }, 'PATCH')
  check(updated.firstName === 'Updated', 'profile edits persist')
  await request('/account/profile', admin.token, { ...updated, nickname: first.nickname }, 'PATCH', 409)
  await request('/account/logout', admin.token, {})
  await request('/account/profile', admin.token, undefined, 'GET', 401)
  check(true, 'logout invalidates token on server')
  console.log('All ' + checks + ' requirement checks passed.')
} finally {
  // Delete only accounts created by this invocation; their channels cascade.
  for (const id of createdIds) {
    await sql.execute('DELETE FROM auth_access_tokens WHERE tokenable_id = ?', [id])
    await sql.execute('DELETE FROM users WHERE id = ?', [id])
  }
  await sql.end()
}

