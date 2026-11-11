import User from '#models/user'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import { publicProfile } from '#services/profile'

export default class AccessTokensController {
  async store({ request }: HttpContext) {
    const { nickname, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(nickname, password)
    user.status = 'online'
    await user.save()
    const token = await User.accessTokens.create(user)

    return {
      user: publicProfile(user),
      token: token.value!.release(),
    }
  }

  async destroy({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    user.status = 'offline'
    await user.save()
    if (user.currentAccessToken) {
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    }

    return {
      message: 'Logged out successfully',
    }
  }
}
