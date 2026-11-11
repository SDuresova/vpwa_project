import type { HttpContext } from '@adonisjs/core/http'
import { channelAction, chatSnapshot, fail, sendMessage } from '#services/chat_service'

export default class ChatController {
  async index({ auth }: HttpContext) {
    return chatSnapshot(auth.getUserOrFail().id)
  }

  async action({ auth, request }: HttpContext) {
    const { action, channelId, args = [] } = request.only(['action', 'channelId', 'args'])
    if (typeof action !== 'string' || !Array.isArray(args) || args.some((arg) => typeof arg !== 'string')) fail('Invalid command.')
    return channelAction(auth.getUserOrFail().id, action, Number(channelId), args)
  }

  async message({ auth, request }: HttpContext) {
    return sendMessage(auth.getUserOrFail().id, Number(request.input('channelId')), request.input('content'))
  }
}
