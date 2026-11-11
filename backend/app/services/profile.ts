import type User from '#models/user'

export function publicProfile(user: User) {
  return {
    id: user.id, firstName: user.firstName, lastName: user.lastName,
    nickname: user.nickname, email: user.email, status: user.status,
  }
}
