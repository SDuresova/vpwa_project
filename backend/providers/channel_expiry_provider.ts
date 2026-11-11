export default class ChannelExpiryProvider {
  private timer?: ReturnType<typeof setInterval>
  private running?: Promise<void>

  async ready() {
    const { expireChannels } = await import('#services/chat_service')
    const { default: logger } = await import('@adonisjs/core/services/logger')
    const sweep = () => {
      if (this.running) return
      this.running = expireChannels()
        .catch((error) => { logger.error({ err: error }, 'Channel expiration failed') })
        .finally(() => { this.running = undefined })
    }
    sweep()
    this.timer = setInterval(sweep, 60_000)
    this.timer.unref()
  }

  async shutdown() {
    clearInterval(this.timer)
    await this.running
  }
}
