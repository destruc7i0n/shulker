'use strict'

const Discord = require('discord.js')
const Rcon = require('./lib/rcon.js')
const express = require('express')
const axios = require('axios')
const emojiStrip = require('emoji-strip')
const app = express()
const http = require('http').Server(app)

const configFile = (process.argv.length > 2) ? process.argv[2] : './config.json'

console.log('[INFO] Using configuration file:', configFile)

const c = require(configFile)

const fixUsername = (username) => username.replace(/(§[A-Z-a-z0-9])/g, '')

function makeDiscordMessage (username, message) {
  // make a discord message string by formatting the configured template with the given parameters
  return c.DISCORD_MESSAGE_TEMPLATE
    .replace('%username%', username)
    .replace('%message%', message)
}

function makeDiscordWebhook (username, message) {
  return {
    username: username,
    content: message,
    'avatar_url': `https://minotar.net/helm/${username}/256.png`
  }
}

function makeMinecraftTellraw (message) {
  // same as the discord side but with discord message parameters
  const username = emojiStrip(message.author.username)
  const discriminator = message.author.discriminator
  const text = emojiStrip(message.cleanContent)

  return c.MINECRAFT_TELLRAW_TEMPLATE
    .replace('%username%', username)
    .replace('%discriminator%', discriminator)
    .replace('%message%', text)
}

const debug = c.DEBUG
const shulker = new Discord.Client()

app.use(function (request, response, next) {
  request.rawBody = ''
  request.setEncoding('utf8')

  request.on('data', function (chunk) {
    request.rawBody += chunk
  })

  request.on('end', function () {
    next()
  })
})

shulker.on('ready', function () {
  app.post(c.WEBHOOK, function (request, response) {
    const body = request.rawBody
    console.log('[INFO] Recieved ' + body)
    const re = new RegExp(c.REGEX_MATCH_CHAT_MC)
    const ignored = new RegExp(c.REGEX_IGNORED_CHAT)
    if (!ignored.test(body)) {
      const bodymatch = body.match(re)
      const username = fixUsername(bodymatch[1])
      const message = bodymatch[2]
      if (debug) {
        console.log('[DEBUG] Username: ' + bodymatch[1])
        console.log('[DEBUG] Text: ' + bodymatch[2])
      }
      if (c.USE_WEBHOOKS) {
        const webhook = makeDiscordWebhook(username, message)
        axios.post(c.WEBHOOK_URL, {
          ...webhook
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
      } else {
        // find the channel
        const channel = shulker.channels.find((ch) => ch.id === c.DISCORD_CHANNEL_ID && ch.type === 'text')
        channel.send(makeDiscordMessage(username, message))
      }
    }
    response.send('')
  })
})

shulker.on('message', function (message) {
  if (message.channel.id === c.DISCORD_CHANNEL_ID && message.channel.type === 'text') {
    if (c.USE_WEBHOOKS && message.webhookID) {
      return // ignore webhooks if using a webhook
    }
    if (message.author.id !== shulker.user.id) {
      if (message.attachments.length) { // skip images/attachments
        return
      }
      const client = new Rcon(c.MINECRAFT_SERVER_RCON_IP, c.MINECRAFT_SERVER_RCON_PORT) // create rcon client
      client.auth(c.MINECRAFT_SERVER_RCON_PASSWORD, function () { // only authenticate when needed
        client.command('tellraw @a ' + makeMinecraftTellraw(message), function (err) {
          if (err) {
            console.log('[ERROR]', err)
          }
          client.close() // close the rcon connection
        })
      })
    }
  }
})

shulker.login(c.DISCORD_TOKEN)

const ipaddress = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || '127.0.0.1'
const serverport = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || c.PORT
if (process.env.OPENSHIFT_NODEJS_IP !== undefined) {
  http.listen(serverport, ipaddress, function () {
    console.log('[INFO] Bot listening on *:' + serverport)
  })
} else {
  http.listen(serverport, function () {
    console.log('[INFO] Bot listening on *:' + c.PORT)
  })
}
