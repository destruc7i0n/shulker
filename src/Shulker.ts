import DiscordClient from './Discord'
import Handler, { LogLine } from './MinecraftHandler'

import { Config } from './Config'

class Shulker {
  config: Config
  discordClient: DiscordClient
  handler: Handler

  readonly deprecatedConfigs: string[] = ['DEATH_KEY_WORDS'];

  constructor() {
  }

  loadConfig () {
    const configFile = (process.argv.length > 2) ? process.argv[2] : '../config.json'
    console.log('[INFO] Using configuration file:', configFile)
    this.config = require(configFile)
    if (!this.config) {
      console.log('[ERROR] Could not load config file!')
      return false
    }

    for (let option of this.deprecatedConfigs) {
      if (this.config.hasOwnProperty(option)) {
        console.log('[WARN] Using deprecated config option ' + option + '. Check README.md for current options.')
      }
    }

    if (this.config.USE_WEBHOOKS) {
      console.log('[INFO] Using Discord WebHooks to send messages')
    } else {
      console.log('[INFO] Using the Discord bot to send messages')
    }

    return true
  }

  onDiscordReady () {
    this.handler.init(async (data: LogLine) => {
      if (data) {
        const { username, message } = data
        await this.discordClient.sendMessage(username, message)
      }
    })
  }

  async init () {
    const loaded = this.loadConfig()
    if (!loaded) return

    this.discordClient = new DiscordClient(this.config, () => this.onDiscordReady())
    this.handler = new Handler(this.config)

    await this.discordClient.init()
  }
}

export default Shulker
