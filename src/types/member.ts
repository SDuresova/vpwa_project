export const USER_STATUSES = ['online', 'dnd', 'offline'] as const
export type UserStatus = (typeof USER_STATUSES)[number]

export interface Member {
    id: number, 
    nickname: string,
    status: UserStatus,  
}