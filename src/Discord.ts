import { Client, Message, TextChannel } from 'discord.js'

import emojiStrip from 'emoji-strip'
import axios from 'axios'

import { Config } from './Config'

import Rcon from './Rcon'

class Discord {
  config: Config
  client: Client

  constructor (config: Config, onReady?: () => void) {
    this.config = config

    this.client = new Client()
    if (onReady) this.client.once('ready', () => onReady())
    this.client.on('message', (message: Message) => this.onMessage(message))
  }

  async init () {
    try {
      await this.client.login(this.config.DISCORD_TOKEN)
    } catch (e) {
      console.log('[ERROR] Could not authenticate with Discord: ' + e)
      if (this.config.DEBUG) console.error(e)
    }
  }

  async onMessage (message: Message) {
    // don't want to check other channels
    if (message.channel.id !== this.config.DISCORD_CHANNEL_ID || message.channel.type !== 'text') return
    // if using webhooks, ignore this!
    if (this.config.USE_WEBHOOKS && message.webhookID) return
    // if the same user as the bot, ignore
    if (message.author.id === this.client.user.id) return
    // ignore any attachments
    if (message.attachments.array().length) return

    const rcon = new Rcon(this.config.MINECRAFT_SERVER_RCON_IP, this.config.MINECRAFT_SERVER_RCON_PORT, this.config.DEBUG)
    try {
      await rcon.auth(this.config.MINECRAFT_SERVER_RCON_PASSWORD)
    } catch (e) {
      console.log('[ERROR] Could not auth with the server!')
      if (this.config.DEBUG) console.error(e)
    }

    let command = ''
    if (this.config.ALLOW_SLASH_COMMANDS && this.config.SLASH_COMMAND_ROLES && message.cleanContent.startsWith('/')) {
      const author = message.member
      if (author.roles.find(r => this.config.SLASH_COMMAND_ROLES.includes(r.name))) {
        // raw command, can be dangerous...
        command = message.cleanContent
      } else {
        console.log('[INFO] User attempted a slash command without a role')
      }
    } else {
      command = `/tellraw @a ${this.makeMinecraftTellraw(message)}`
    }

    if (command) {
      await rcon.command(command).catch((e) => {
        console.log('[ERROR] Could not send command!')
        if (this.config.DEBUG) console.error(e)
      })
    }
    rcon.close()
  }

  makeMinecraftTellraw(message: Message): string {
    const username = emojiStrip(message.author.username)
    const discriminator = message.author.discriminator
    const text = emojiStrip(message.cleanContent)
    // hastily use JSON to encode the strings
    const variables = JSON.parse(JSON.stringify({ username, discriminator, text }))

    return this.config.MINECRAFT_TELLRAW_TEMPLATE
      .replace('%username%', variables.username)
      .replace('%discriminator%', variables.discriminator)
      .replace('%message%', variables.text)
  }

  replaceDiscordMentions(message: string): string {
    const possibleMentions = message.match(/@(\S+)/gim)
    if (possibleMentions) {
      for (let mention of possibleMentions) {
        const mentionParts = mention.split('#')
        let username = mentionParts[0].replace('@', '')
        if (mentionParts.length > 1) {
          if (this.config.ALLOW_USER_MENTIONS) {
            const user = this.client.users.find(user => user.username === username && user.discriminator === mentionParts[1])
            if (user) {
              if (this.config.ALLOW_USER_MENTIONS) {
                message = message.replace(mention, '<@' + user.id + '>')
              }
            }
          }
        }

        if (['here', 'everyone'].includes(username)) {
          // remove these large pings
          if (!this.config.ALLOW_HERE_EVERYONE_MENTIONS) {
            message = message
              .replace('@everyone', '@ everyone')
              .replace('@here', '@ here')
          }
        }
      }
    }
    return message
  }

  makeDiscordWebhook (username: string, message: string) {
    message = this.replaceDiscordMentions(message)

    let avatarURL
    if (username === this.config.SERVER_NAME + ' - Server') { // Use avatar for the server
      avatarURL = this.config.SERVER_IMAGE || 'https://minotar.net/helm/Steve/256.png'
    } else { // Use avatar for player
      avatarURL = `https://minotar.net/helm/${username}/256.png`
    }

    return {
      username: username,
      content: message,
      'avatar_url': avatarURL,
    }
  }

  makeDiscordMessage(username: string, message: string) {
    message = this.replaceDiscordMentions(message)

    return this.config.DISCORD_MESSAGE_TEMPLATE
      .replace('%username%', username)
      .replace('%message%', message)
  }

  async sendMessage (username: string, message: string) {
    if (this.config.USE_WEBHOOKS) {
      const webhook = this.makeDiscordWebhook(username, message)
      try {
        await axios.post(this.config.WEBHOOK_URL, webhook, { headers: { 'Content-Type': 'application/json' } })
      } catch (e) {
        console.log('[ERROR] Could not send Discord message through WebHook!')
        if (this.config.DEBUG) console.log(e)
      }
    } else {
      // find the channel
      const channel = this.client.channels.find((ch) => ch.id === this.config.DISCORD_CHANNEL_ID && ch.type === 'text') as TextChannel
      if (channel) {
        await channel.send(this.makeDiscordMessage(username, message))
      } else {
        console.log(`[ERROR] Could not find channel with ID ${this.config.DISCORD_CHANNEL_ID}!`)
      }
    }
  }
}

export default Discord
