import fs from 'fs'

import DiscordClient from './Discord'
import Handler, { LogLine } from './MinecraftHandler'

import type { Config } from './Config'

interface OutdatedConfigMessages {
  [key: string]: string
}

class Shulker {
  config: Config
  discordClient: DiscordClient
  handler: Handler

  readonly deprecatedConfigs: OutdatedConfigMessages = {
    'DEATH_KEY_WORDS': '`DEATH_KEY_WORDS` has been replaced with `REGEX_DEATH_MESSAGE`. Please update this from the latest example config.'
  }

  readonly removedConfigs: OutdatedConfigMessages = {
    'DISCORD_CHANNEL_NAME': 'Please remove this config line. Use the channel ID with `DISCORD_CHANNEL_ID` rather than the channel name.',
    'SLASH_COMMAND_ROLES': 'Please use the slash command role IDs with `SLASH_COMMAND_ROLES_IDS` instead.'
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

    for (const configKey of Object.keys(this.deprecatedConfigs)) {
      if (this.config.hasOwnProperty(configKey)) {
        console.log('[WARN] Using deprecated config option ' + configKey + '. Check README.md for current options. These options will be removed in a future release.')
        console.log('       ' + this.deprecatedConfigs[configKey])
      }
    }

    const hasRemovedConfig = Object.keys(this.config).some(key => Object.keys(this.removedConfigs).includes(key))
    if (hasRemovedConfig) {
      for (const configKey of Object.keys(this.removedConfigs)) {
        if (this.config.hasOwnProperty(configKey)) {
          console.log('[ERROR] Using removed config option ' + configKey + '. Check README.md for current options.')
          console.log('        ' + this.removedConfigs[configKey])
        }
      }
      process.exit(1)
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
