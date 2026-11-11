import vine from '@vinejs/vine'
import User from '#models/user'
import { publicProfile } from '#services/profile'
import { fail } from '#services/chat_service'
import type { HttpContext } from '@adonisjs/core/http'

const validator = vine.create({
  firstName: vine.string().trim().minLength(1).maxLength(64),
  lastName: vine.string().trim().minLength(1).maxLength(64),
  nickname: vine.string().trim().minLength(3).maxLength(32).regex(/^[a-zA-Z0-9_-]+$/),
  email: vine.string().email().maxLength(254),
  status: vine.enum(['online', 'offline', 'dnd']),
})

export default class ProfileController {
  async show({ auth }: HttpContext) {
    return publicProfile(auth.getUserOrFail())
  }

  async update({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(validator)
    const duplicate = await User.query().whereNot('id', user.id)
      .where((q) => q.where('nickname', data.nickname).orWhere('email', data.email)).first()
    if (duplicate) fail('Nickname or email is already taken.', 409)
    try {
      await user.merge(data).save()
    } catch (error) {
      if ((error as { code?: string }).code === 'ER_DUP_ENTRY') fail('Nickname or email is already taken.', 409)
      throw error
    }
    return publicProfile(user)
  }
}
