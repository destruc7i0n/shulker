import path from 'path'
import fs from 'fs'

import DiscordClient from './Discord'
import Handler, { LogLine } from './MinecraftHandler'

import { Config } from './Config'

class Shulker {
  config: Config
  discordClient: DiscordClient
  handler: Handler

  constructor() {
  }

  loadConfig () {
    const configFile = process.argv.length > 2 ? process.argv[2] : './config.json'
    if (!fs.existsSync(configFile)) {
      console.log('[ERROR] Could not find config file!')
      return false
    }
    console.log('[INFO] Using configuration file:', configFile)

    try {
      this.config = JSON.parse(fs.readFileSync(configFile, 'utf8'))
    } catch (e) {
      console.log('[ERROR] Could not load config file!')
      return false
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
