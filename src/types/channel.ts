export const CHANNEL_PRIV_TYPE = ['private', 'public'] as const
export type ChannelPrivacyType = (typeof CHANNEL_PRIV_TYPE)[number]

export interface Channel {
  id: number,
  name: string,
  type: ChannelPrivacyType,
  adminId: number,
  memberIds: number[], // Am I member???
  bannedIds: number[],
 
  // logged user look
  invited: boolean,
  invitationRead: boolean,
  pinned: boolean,
  unreadCount: number,
}

