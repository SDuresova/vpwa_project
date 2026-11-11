import User from '#models/user'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import { publicProfile } from '#services/profile'
import { fail } from '#services/chat_service'

export default class NewAccountController {
  async store({ request }: HttpContext) {
    const { firstName, lastName, nickname, email, password } = await request.validateUsing(signupValidator)

    try {
      const user = await User.create({ firstName, lastName, nickname, email, password, status: 'online' })
      return { user: publicProfile(user) }
    } catch (error) {
      if ((error as { code?: string }).code === 'ER_DUP_ENTRY') fail('Nickname or email is already taken.', 409)
      throw error
    }
  }
}
