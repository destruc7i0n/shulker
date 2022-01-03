import { WebhookClient, WebhookMessageOptions } from 'discord.js'

import axios from 'axios'

import type { Config } from './Config'

class DiscordWebhooks {
  private config: Config

  private webhookClient: WebhookClient

  private uuidCache: Map<string, string>

  public id: string | null
  private token: string | null

  constructor (config: Config) {
    this.config = config

    this.id = null
    this.token = null

    this.uuidCache = new Map()
  }

  public init () {
    const { id, token } = this.parseDiscordWebhook(this.config.WEBHOOK_URL)

    if (!id || !token) {
      process.exit(1)
    }

    this.id = id
    this.token = token

    this.webhookClient = new WebhookClient({ id, token })

    if (this.config.DEBUG) {
      this.webhookClient.on('rateLimit', (data) => console.log(`[DEBUG] Webhook is being rate limited. Timeout: ${data.timeout / 1000}s, Limit: ${data.limit}`))
    }
  }

  private parseDiscordWebhook (url: string) {
    const re = /discord[app]?.com\/api\/webhooks\/([^\/]+)\/([^\/]+)/

    // the is of the webhook
    let id = null
    let token = null

    if (!re.test(url)) {
      // In case the url changes at some point, I will warn if it still works
      console.log('[WARN] The Webhook URL may not be valid!')
    } else {
      const match = url.match(re)
      id = match?.[1]
      token = match?.[2]
    }

    return { id, token }
  }

  private async getUUIDFromUsername (username: string): Promise<string | null> {
    username = username.toLowerCase()
    if (this.uuidCache.has(username)) return this.uuidCache.get(username)!
    // otherwise fetch and store
    try {
      const response = await (
        await axios.get((this.config.UUID_API_URL ?? 'https://api.mojang.com/users/profiles/minecraft/%username%').replace('%username%', username))
      ).data
      const uuid = response.id
      this.uuidCache.set(username, uuid)
      if (this.config.DEBUG) console.log(`[DEBUG] Fetched UUID ${uuid} for username "${username}"`)
      return uuid
    } catch (e) {
      console.log(`[ERROR] Could not fetch uuid for ${username}, falling back to Steve for the skin`)
      return null
    }
  }

  private getHeadUrl(uuid: string): string {
    const url = this.config.HEAD_IMAGE_URL || 'https://mc-heads.net/avatar/%uuid%/256'
    return url.replace(/%uuid%/, uuid)
  }

  private async makeDiscordWebhook (username: string, message: string) {
    const defaultHead = this.getHeadUrl(this.config.DEFAULT_PLAYER_HEAD || 'c06f89064c8a49119c29ea1dbd1aab82') // MHF_Steve

    const messsageOptions: WebhookMessageOptions = {
      username,
      content: message,
    }

    if (username === this.config.SERVER_NAME + ' - Server') { // use avatar for the server
      if (this.config.SERVER_IMAGE) messsageOptions.avatarURL = this.config.SERVER_IMAGE
    } else { // use avatar for player
      const uuid = await this.getUUIDFromUsername(username)
      messsageOptions.avatarURL = !!uuid ? this.getHeadUrl(uuid) : defaultHead
    }

    return messsageOptions
  }

  public async sendMessage (username: string, message: string) {
    const webhookContent = await this.makeDiscordWebhook(username, message)
    try {
      await this.webhookClient!.send(webhookContent)
      return true
    } catch (e) {
      console.log('[ERROR] Could not send Discord message through WebHook! Falling back to sending through bot.')
      if (this.config.DEBUG) console.log(e)
      return false
    }
  }
}

export default DiscordWebhooks
