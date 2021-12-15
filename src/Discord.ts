import {Client, Intents, Message, TextChannel, User} from 'discord.js'

import emojiStrip from 'emoji-strip'
import axios from 'axios'

import { Config } from './Config'

import Rcon from './Rcon'

class Discord {
  config: Config
  client: Client

  channel: TextChannel | null

  uuidCache: Map<string, string>
  mentionCache: Map<string, User>

  constructor (config: Config, onReady?: () => void) {
    this.config = config

    this.client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })
    if (onReady) this.client.once('ready', () => onReady())
    this.client.on('messageCreate', (message: Message) => this.onMessage(message))

    this.channel = null

    this.uuidCache = new Map()
    this.mentionCache = new Map()
  }

  public async init () {
    try {
      await this.client.login(this.config.DISCORD_TOKEN)
    } catch (e) {
      console.log('[ERROR] Could not authenticate with Discord: ' + e)
      if (this.config.DEBUG) console.error(e)
      process.exit(1)
    }

    if (this.config.DISCORD_CHANNEL_NAME && !this.config.DISCORD_CHANNEL_ID) {
      await this.getChannelIdFromName(this.config.DISCORD_CHANNEL_NAME)
    } else if (this.config.DISCORD_CHANNEL_ID) {
      const channel = await this.client.channels.fetch(this.config.DISCORD_CHANNEL_ID) as TextChannel
      if (!channel) {
        console.log(`[INFO] Could not find channel with ID ${this.config.DISCORD_CHANNEL_ID}. Please check that the ID is correct and that the bot has access to it.`)
        process.exit(1)
      }
      this.channel = channel
    }

    if (this.channel) {
      console.log(`[INFO] Using channel #${this.channel.name} (id: ${this.channel.id}) in the server "${this.channel.guild.name}"`)
    }
  }

  private async getChannelIdFromName (name: string) {
    // remove the # if there is one
    if (name.startsWith('#')) name = name.substring(1, name.length)

    // fetch all the channels in every server
    for (const guild of this.client.guilds.cache.values()) {
      await guild.channels.fetch()
    }

    const channel = this.client.channels.cache.find((c) => c.isText() && c.type === 'GUILD_TEXT' && c.name === name && !c.deleted)
    if (channel) {
      this.channel = channel as TextChannel
    } else {
      console.log(`[INFO] Could not find channel ${name}! Check that the name is correct or use the ID of the channel instead (DISCORD_CHANNEL_ID)!`)
      process.exit(1)
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
    if (message.channel.id !== this.channel.id || message.channel.type !== 'GUILD_TEXT') return
    // if using webhooks, ignore this!
    if (message.webhookId) {
      // backwards compatability with older config
      if (this.config.USE_WEBHOOKS && this.config.IGNORE_WEBHOOKS === undefined) return

      // if ignoring all webhooks, ignore
      if (this.config.IGNORE_WEBHOOKS) {
        return
      } else if (this.config.USE_WEBHOOKS) {
        // otherwise, ignore all webhooks that are not the same as this one
        const { id } = this.parseDiscordWebhook(this.config.WEBHOOK_URL)
        if (id === message.webhookId) {
          if (this.config.DEBUG) console.log('[INFO] Ignoring webhook from self')
          return
        }
      }
    }
    // ensure that the message has a sender
    if (!message.author) return
    // ensure that the message is a text message
    if (message.type !== 'DEFAULT') return
    // if the same user as the bot, ignore
    if (message.author.id === this.client.user?.id) return
    // ignore any attachments
    if (message.attachments.size) return

    const rcon = new Rcon(this.config.MINECRAFT_SERVER_RCON_IP, this.config.MINECRAFT_SERVER_RCON_PORT, this.config.DEBUG)
    try {
      await rcon.auth(this.config.MINECRAFT_SERVER_RCON_PASSWORD)
    } catch (e) {
      console.log('[ERROR] Could not auth with the server!')
      if (this.config.DEBUG) console.error(e)
    }

    let command = ''
    if (this.config.ALLOW_SLASH_COMMANDS && this.config.SLASH_COMMAND_ROLES && message.cleanContent.startsWith('/') && message.member) {
      if (message.member.roles.cache.find(r => this.config.SLASH_COMMAND_ROLES.includes(r.name))) {
        // send the raw command, can be dangerous...
        command = message.cleanContent
      } else {
        console.log('[INFO] User attempted a slash command without a role')
      }
    } else {
      if (this.config.MINECRAFT_TELLRAW_DOESNT_EXIST) {
        command = `/say ${this.makeMinecraftTellraw(message)}`
      } else {
        command = `/tellraw @a ${this.makeMinecraftTellraw(message)}`
      }
    }

    if (this.config.DEBUG) console.log(`[DEBUG] Sending command "${command}" to the server`)

    if (command) {
      await rcon.command(command).catch((e) => {
        console.log('[ERROR] Could not send command!')
        if (this.config.DEBUG) console.error(e)
      }).then((str) => {
        if (str === 'Unknown command. Try /help for a list of commands') {
            console.error('[ERROR] Could not send command! (Unknown command)')
            console.error('if this was a chat message, please look into MINECRAFT_TELLRAW_DOESNT_EXIST!')
            console.error('command: ' + command)
        }
      })
    }
    rcon.close()
  }

  private makeMinecraftTellraw(message: Message): string {
    const username = emojiStrip(message.author.username)
    const variables: {[index: string]: string} = {
      username,
      nickname: !!message.member?.nickname ? emojiStrip(message.member.nickname) : username,
      discriminator: message.author.discriminator,
      text: emojiStrip(message.cleanContent)
    }
    // hastily use JSON to encode the strings
    for (const v of Object.keys(variables)) {
      variables[v] = JSON.stringify(variables[v]).slice(1,-1)
    }
    
    if (this.config.MINECRAFT_TELLRAW_DOESNT_EXIST)
    {
        return this.config.MINECRAFT_TELLRAW_DOESNT_EXIST_SAY_TEMPLATE
                .replace(/%username%/g, variables.username)
                .replace(/%nickname%/g, variables.nickname)
                .replace(/%discriminator%/g, variables.discriminator)
                .replace(/%message%/g, variables.text)
    }


    return this.config.MINECRAFT_TELLRAW_TEMPLATE
      .replace(/%username%/g, variables.username)
      .replace(/%nickname%/g, variables.nickname)
      .replace(/%discriminator%/g, variables.discriminator)
      .replace(/%message%/g, variables.text)
  }

  private async replaceDiscordMentions(message: string): Promise<string> {
    const possibleMentions = message.match(/@[^#\s]*[#]?[0-9]{4}/gim)
    if (possibleMentions) {
      for (let mention of possibleMentions) {
        const mentionParts = mention.split('#')
        let username = mentionParts[0].replace('@', '')
        if (mentionParts.length > 1) {
          if (this.config.ALLOW_USER_MENTIONS) {
            let user = this.mentionCache.get(mention)
            if (!user) {
              // try fetching members by username to update cache
              await this.channel!.guild.members.fetch({ query: username })
              user = this.client.users.cache.find(user => user.username === username && user.discriminator === mentionParts[1])
            }

            if (user) {
              message = message.replace(mention, '<@' + user.id + '>')
              if (!this.mentionCache.has(mention)) this.mentionCache.set(mention, user)
            } else {
              console.log(`[ERROR] Could not find user by mention: "${mention}"`)
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

  private async getUUIDFromUsername (username: string): Promise<string | null> {
    username = username.toLowerCase()
    if (this.uuidCache.has(username)) return this.uuidCache.get(username)!
    // otherwise fetch and store
    try {
      const response = await (await axios.get('https://api.mojang.com/users/profiles/minecraft/' + username)).data
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

    let avatarURL
    if (username === this.config.SERVER_NAME + ' - Server') { // use avatar for the server
      avatarURL = this.config.SERVER_IMAGE || defaultHead
    } else { // use avatar for player
      const uuid = await this.getUUIDFromUsername(username)
      avatarURL = !!uuid ? this.getHeadUrl(uuid) : defaultHead
    }

    return {
      username,
      content: message,
      'avatar_url': avatarURL,
    }
  }

  private makeDiscordMessage(username: string, message: string) {
    return this.config.DISCORD_MESSAGE_TEMPLATE
      .replace('%username%', username)
      .replace('%message%', message)
  }

  public async sendMessage (username: string, message: string) {
    message = await this.replaceDiscordMentions(message)

    if (this.config.USE_WEBHOOKS) {
      const webhook = await this.makeDiscordWebhook(username, message)
      try {
        await axios.post(this.config.WEBHOOK_URL, webhook, { headers: { 'Content-Type': 'application/json' } })
      } catch (e) {
        console.log('[ERROR] Could not send Discord message through WebHook!')
        if (this.config.DEBUG) console.log(e)
      }
    } else {
      try {
        await this.channel!.send(this.makeDiscordMessage(username, message))
      } catch (e) {
        console.log('[ERROR] Could not send Discord message through bot!')
        process.exit(1)
      }
    }
  }
}

export default Discord
