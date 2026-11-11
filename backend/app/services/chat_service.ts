import db from '@adonisjs/lucid/services/db'
import { Exception } from '@adonisjs/core/exceptions'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export function fail(message: string, status = 400): never {
  throw new Exception(message, { status })
}

// Expiration is checked before every read/write, including name reuse. The DB
// clock is authoritative; inviting or viewing a channel never extends its life.
export async function expireChannels() {
  await db.from('channels').where('last_message_at', '<', db.raw('DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY)')).delete()
}

export async function chatSnapshot(userId: number) {
  await expireChannels()
  return db.transaction(async (trx) => {
    const memberships = await trx.from('channel_members').where('user_id', userId)
    const ids = memberships.map((m) => m.channel_id)
    const activeIds = memberships.filter((m) => !m.invited).map((m) => m.channel_id)
    const rows = ids.length ? await trx.from('channels').whereIn('id', ids) : []
    const members = activeIds.length ? await trx.from('channel_members').whereIn('channel_id', activeIds).where('invited', false) : []
    const bans = activeIds.length ? await trx.from('channel_bans').whereIn('channel_id', activeIds) : []
    const history = activeIds.length ? await trx.from('messages').whereIn('channel_id', activeIds).orderBy('id') : []
    const users = await trx.from('users').select('id', 'nickname', 'status')
    const summaries = rows.map((c) => {
        const membership = memberships.find((m) => m.channel_id === c.id)!
        return {
          id: c.id, name: c.name, type: c.type, adminId: c.admin_id,
          memberIds: members.filter((m) => m.channel_id === c.id).map((m) => m.user_id),
          bannedIds: bans.filter((b) => b.channel_id === c.id).map((b) => b.user_id),
          invited: !!membership.invited, invitationRead: !!membership.invitation_read,
          pinned: !!membership.pinned,
          unreadCount: history.filter((m) => m.channel_id === c.id && m.author_id !== userId && m.id > membership.last_read_message_id).length,
        }
      })
    return {
      users,
      channels: summaries.filter((c) => !c.invited),
      invitations: summaries.filter((c) => c.invited),
      messages: history.map((m) => ({
        id: m.id, channelId: m.channel_id, authorId: m.author_id,
        content: m.content, createdAt: new Date(m.created_at).toISOString(),
        mentionedUsers: JSON.parse(m.mentioned_users),
      })),
    }
  })
}

export async function requireChannel(trx: TransactionClientContract, id: number, userId: number, allowPending = false) {
  if (!Number.isSafeInteger(id) || id < 1) fail('Select a channel first.')
  const channel = await trx.from('channels').where('id', id).forUpdate().first()
  if (!channel) fail('Channel no longer exists.', 404)
  const member = await trx.from('channel_members').where({ channel_id: id, user_id: userId }).first()
  if (!member || (member.invited && !allowPending)) fail('Accept the invitation before accessing this channel.', 403)
  return { channel, member }
}

async function clearVotes(trx: TransactionClientContract, channelId: number, userId: number) {
  await trx.from('channel_kick_votes').where('channel_id', channelId)
    .where((q) => q.where('target_id', userId).orWhere('voter_id', userId)).delete()
}

export async function channelAction(userId: number, action: string, channelId: number, args: string[], retries = 3): Promise<{ navigateTo?: number; message: string; banned?: boolean; votes?: number }> {
  await expireChannels()
  try {
    return await db.transaction(async (trx) => {
      if (action === 'join' || action === 'create') {
        const [name, visibility] = args
        if (!name || !/^[a-z0-9-]{1,64}$/.test(name)) fail('Channel names use 1–64 lowercase letters, numbers or hyphens.')
        if (args.length > 2 || (visibility && visibility !== 'private' && visibility !== 'public')) fail('Usage: /join channelName [private]')
        const existing = await trx.from('channels').where('name', name).forUpdate().first()
        if (!existing) {
          const [id] = await trx.table('channels').insert({ name, type: visibility === 'private' ? 'private' : 'public', admin_id: userId, last_message_at: trx.raw('UTC_TIMESTAMP()') })
          await trx.table('channel_members').insert({ channel_id: id, user_id: userId })
          return { navigateTo: id, message: `Created #${name}.` }
        }
        if (action === 'create') fail('This channel name is already taken.', 409)
        if (visibility === 'private' && existing.type !== 'private') fail('That name belongs to a public channel.')
        if (await trx.from('channel_bans').where({ channel_id: existing.id, user_id: userId }).first()) fail('You are banned from this channel.', 403)
        const membership = await trx.from('channel_members').where({ channel_id: existing.id, user_id: userId }).first()
        if (membership?.invited) fail('Accept the invitation in your Inbox first.', 403)
        if (existing.type === 'private' && !membership) fail('Only the administrator can invite you to this private channel.', 403)
        if (!membership) await trx.table('channel_members').insert({ channel_id: existing.id, user_id: userId })
        else await trx.from('channel_members').where({ channel_id: existing.id, user_id: userId }).update({ invited: false, invitation_read: true })
        return { navigateTo: existing.id, message: `Joined #${name}.` }
      }

      const invitationAction = ['accept', 'decline', 'read'].includes(action)
      const { channel, member } = await requireChannel(trx, channelId, userId, invitationAction)
      if (invitationAction && !member.invited) fail('No pending invitation exists.', 409)
      if (action === 'readMessages') {
        const throughId = Number(args[0])
        if (args.length !== 1 || !Number.isSafeInteger(throughId) || throughId < 1) fail('Invalid message cursor.')
        const message = await trx.from('messages').where({ id: throughId, channel_id: channelId }).first()
        if (!message) fail('Message does not belong to this channel.')
        await trx.from('channel_members').where({ channel_id: channelId, user_id: userId })
          .update({ last_read_message_id: Math.max(Number(member.last_read_message_id), throughId) })
        return { message: '' }
      }
      const admin = channel.admin_id === userId
      if (action === 'quit' || action === 'cancel' || action === 'decline') {
        if (action === 'quit' && !admin) fail('Only the administrator can delete this channel.', 403)
        if (admin) await trx.from('channels').where('id', channelId).delete()
        else {
          await trx.from('channel_members').where({ channel_id: channelId, user_id: userId }).delete()
          await clearVotes(trx, channelId, userId)
        }
        return { message: admin ? 'Channel deleted.' : 'You left the channel.' }
      }
      if (action === 'pin' || action === 'read' || action === 'accept') {
        const values = action === 'pin' ? { pinned: !member.pinned }
          : action === 'read' ? { invitation_read: true } : { invited: false, invitation_read: true, pinned: true }
        await trx.from('channel_members').where({ channel_id: channelId, user_id: userId }).update(values)
        return { message: '' }
      }
      if (!['invite', 'revoke', 'kick'].includes(action)) fail('Unknown channel command.')
      if (args.length !== 1) fail(`Usage: /${action} nickName`)
      const nickname = args[0].replace(/^@/, '')
      const target = await trx.from('users').where('nickname', nickname).first()
      if (!target) fail('User not found.', 404)
      if (target.id === userId) fail('Use /cancel to leave the channel yourself.')
      if (target.id === channel.admin_id) fail('The channel administrator cannot be removed.')
      const key = { channel_id: channelId, user_id: target.id }
      const targetMember = await trx.from('channel_members').where(key).first()
      if (action === 'invite') {
        if (channel.type === 'private' && !admin) fail('Only the administrator can invite to a private channel.', 403)
        const banned = await trx.from('channel_bans').where(key).first()
        if (banned && !admin) fail('Only the administrator can restore a banned user.', 403)
        if (targetMember) fail(targetMember.invited ? 'This user already has a pending invitation.' : 'This user is already a member.', 409)
        await trx.from('channel_bans').where(key).delete()
        await clearVotes(trx, channelId, target.id)
        await trx.table('channel_members').insert({ ...key, invited: true, invitation_read: false, pinned: true })
        return { message: `Invited @${target.nickname}.` }
      }
      if (!targetMember) fail('This user is not a member of this channel.')
      if (action === 'revoke') {
        if (channel.type !== 'private' || !admin) fail('Only the administrator of a private channel can use /revoke.', 403)
        await trx.from('channel_members').where(key).delete()
        await clearVotes(trx, channelId, target.id)
        return { message: `Removed @${target.nickname}.` }
      }
      if (channel.type !== 'public') fail('/kick is only available in public channels.')
      if (targetMember.invited && !admin) fail('This user has not accepted the invitation yet.', 400)
      let votes = 3
      if (!admin) {
        const voteKey = { channel_id: channelId, target_id: target.id, voter_id: userId }
        if (await trx.from('channel_kick_votes').where(voteKey).first()) fail('You have already voted to kick this user.', 409)
        await trx.table('channel_kick_votes').insert(voteKey)
        const result = await trx.from('channel_kick_votes').where({ channel_id: channelId, target_id: target.id }).count('* as total').first()
        votes = Number(result!.total)
      }
      if (votes >= 3) {
        await trx.from('channel_members').where(key).delete()
        await trx.table('channel_bans').insert(key)
        await clearVotes(trx, channelId, target.id)
      }
      return { banned: votes >= 3, votes, message: votes >= 3 ? `Banned @${target.nickname}.` : `Kick vote recorded (${votes}/3).` }
    })
  } catch (error) {
    const code = (error as { code?: string }).code
    if (retries > 0 && (code === 'ER_LOCK_DEADLOCK' || (action === 'join' && code === 'ER_DUP_ENTRY'))) {
      return channelAction(userId, action, channelId, args, retries - 1)
    }
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') fail('That name or membership already exists. Please refresh and try again.', 409)
    throw error
  }
}

export async function sendMessage(userId: number, channelId: number, content: string) {
  if (typeof content !== 'string' || !content.trim() || content.length > 10000) fail('Messages must contain 1–10000 characters.')
  await expireChannels()
  return db.transaction(async (trx) => {
    await requireChannel(trx, channelId, userId)
    const nicknames = [...content.matchAll(/(?:^|\s)@([a-zA-Z0-9_-]+)/g)].map((m) => m[1])
    const mentioned = nicknames.length ? await trx.from('users')
      .join('channel_members', 'users.id', 'channel_members.user_id')
      .where('channel_members.channel_id', channelId).where('channel_members.invited', false).whereIn('users.nickname', nicknames).select('users.id') : []
    const mentionedUsers = [...new Set(mentioned.map((u) => u.id))]
    const [id] = await trx.table('messages').insert({ channel_id: channelId, author_id: userId, content: content.trim(), mentioned_users: JSON.stringify(mentionedUsers), created_at: trx.raw('UTC_TIMESTAMP()') })
    await trx.from('channels').where('id', channelId).update({ last_message_at: trx.raw('UTC_TIMESTAMP()') })
    return { id }
  })
}
