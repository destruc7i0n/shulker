import {Client, Message, Snowflake, TextChannel} from 'discord.js'

import emojiStrip from 'emoji-strip'
import axios from 'axios'

import { Config } from './Config'

import Rcon from './Rcon'

class Discord {
  config: Config
  client: Client

  channel: Snowflake

  constructor (config: Config, onReady?: () => void) {
    this.config = config

    this.client = new Client()
    if (onReady) this.client.once('ready', () => onReady())
    this.client.on('message', (message: Message) => this.onMessage(message))

    this.channel = config.DISCORD_CHANNEL_ID || ''
  }

  public async init () {
    try {
      await this.client.login(this.config.DISCORD_TOKEN)
      if (this.config.DISCORD_CHANNEL_NAME && !this.config.DISCORD_CHANNEL_ID)
        this.getChannelIdFromName(this.config.DISCORD_CHANNEL_NAME)
    } catch (e) {
      console.log('[ERROR] Could not authenticate with Discord: ' + e)
      if (this.config.DEBUG) console.error(e)
    }
  }

  private getChannelIdFromName (name: string) {
    // remove the # if there is one
    if (name.startsWith('#')) name = name.substring(1, name.length)
    // @ts-ignore
    const channel: TextChannel = this.client.channels.find((c: TextChannel) => c.type === 'text' && c.name === name && !c.deleted)
    if (channel) {
      this.channel = channel.id
      console.log(`[INFO] Found channel #${channel.name} (id: ${channel.id}) in the server "${channel.guild.name}"`)
    } else {
      console.log(`[INFO] Could not find channel ${name}! Check that the name is correct or use the ID of the channel instead (DISCORD_CHANNEL_ID)!`)
      process.exit(1)
    }
  }

  private parseDiscordWebhook (url: string) {
    const re = /discordapp.com\/api\/webhooks\/([^\/]+)\/([^\/]+)/

    // the is of the webhook
    let id = null
    let token = null

    if (!re.test(url)) {
      // In case the url changes at some point, I will warn if it still works
      console.log('[WARN] The Webhook URL may not be valid!')
    } else {
      const match = url.match(re)
      if (match) {
        id = match[1]
        token = match[2]
      }
    }

    return { id, token }
  }

  private async onMessage (message: Message) {
    // no channel, done
    if (!this.channel) return
    // don't want to check other channels
    if (message.channel.id !== this.channel || message.channel.type !== 'text') return
    // if using webhooks, ignore this!
    if (message.webhookID) {
      // backwards compatability with older config
      if (this.config.USE_WEBHOOKS && this.config.IGNORE_WEBHOOKS === undefined) return

      // if ignoring all webhooks, ignore
      if (this.config.IGNORE_WEBHOOKS) {
        return
      } else if (this.config.USE_WEBHOOKS) {
        // otherwise, ignore all webhooks that are not the same as this one
        const { id } = this.parseDiscordWebhook(this.config.WEBHOOK_URL)
        if (id === message.webhookID) {
          if (this.config.DEBUG) console.log('[INFO] Ignoring webhook from self')
          return
        }
      }
    }
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
        // send the raw command, can be dangerous...
        command = message.cleanContent
      } else {
        console.log('[INFO] User attempted a slash command without a role')
      }
    } else {
      command = `/tellraw @a ${this.makeMinecraftTellraw(message)}`
    }

    if (this.config.DEBUG) console.log(`[DEBUG] Sending command "${command}" to the server`)

    if (command) {
      await rcon.command(command).catch((e) => {
        console.log('[ERROR] Could not send command!')
        if (this.config.DEBUG) console.error(e)
      })
    }
    rcon.close()
  }

  private makeMinecraftTellraw(message: Message): string {
    const variables: {[index: string]: string} = {
      username: emojiStrip(message.author.username),
      discriminator: message.author.discriminator,
      text: emojiStrip(message.cleanContent)
    }
    // hastily use JSON to encode the strings
    for (const v of Object.keys(variables)) {
      variables[v] = JSON.stringify(variables[v]).slice(1,-1)
    }

    return this.config.MINECRAFT_TELLRAW_TEMPLATE
      // new RegExp('%example%', 'g') will replace every instance of %example% in the TELLRAW_TEMPLATE
      .replace(new RegExp('%username%', 'g'), variables.username)
      .replace(new RegExp('%discriminator%', 'g'), variables.discriminator)
      .replace(new RegExp('%message%', 'g'), variables.text)
  }

  private replaceDiscordMentions(message: string): string {
    const possibleMentions = message.match(/@(\S+)/gim)
    if (possibleMentions) {
      for (let mention of possibleMentions) {
        const mentionParts = mention.split('#')
        let username = mentionParts[0].replace('@', '')
        if (mentionParts.length > 1) {
          if (this.config.ALLOW_USER_MENTIONS) {
            const user = this.client.users.find(user => user.username === username && user.discriminator === mentionParts[1])
            if (user) {
              message = message.replace(mention, '<@' + user.id + '>')
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

  private makeDiscordWebhook (username: string, message: string) {
    message = this.replaceDiscordMentions(message)

    let avatarURL
    if (username === this.config.SERVER_NAME + ' - Server') { // use avatar for the server
      avatarURL = this.config.SERVER_IMAGE || 'https://minotar.net/helm/Steve/256.png'
    } else { // use avatar for player
      avatarURL = `https://minotar.net/helm/${username}/256.png`
    }

    return {
      username: username,
      content: message,
      'avatar_url': avatarURL,
    }
  }

  private makeDiscordMessage(username: string, message: string) {
    message = this.replaceDiscordMentions(message)

    return this.config.DISCORD_MESSAGE_TEMPLATE
      .replace('%username%', username)
      .replace('%message%', message)
  }

  public async sendMessage (username: string, message: string) {
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
