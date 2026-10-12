import { UserStatus } from "./member"

export interface Profile {
    id: number,
    firstName: string,
    lastName: string,
    nickname: string,
    status: UserStatus,
}