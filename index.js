'use strict'

const Discord = require('discord.js')
const Rcon = require('./lib/rcon.js')
const express = require('express')
const axios = require('axios')
const emojiStrip = require('emoji-strip')
const { Tail } = require('tail')
const fs = require('fs')

const configFile = (process.argv.length > 2) ? process.argv[2] : './config.json'

console.log('[INFO] Using configuration file:', configFile)

const c = require(configFile)

let app = null
let tail = null

function fixUsername (username) {
  return username.replace(/(§[A-Z-a-z0-9])/g, '')
}

// replace mentions with discriminator with the actual mention
function replaceDiscordMentions (message) {
  if (c.ALLOW_USER_MENTIONS) {
    const possibleMentions = message.match(/@(\S+)/gim)
    if (possibleMentions) {
      for (let mention of possibleMentions) {
        const mentionParts = mention.split('#')
        let username = mentionParts[0].replace('@', '')
        if (mentionParts.length > 1) {
          const user = shulker.users.find(user => user.username === username && user.discriminator === mentionParts[1])
          if (user) {
            message = message.replace(mention, '<@' + user.id + '>')
          }
        }
      }
    }
  }
  return message
}

function makeDiscordMessage (username, message) {
  // make a discord message string by formatting the configured template with the given parameters
  message = replaceDiscordMentions(message)

  return c.DISCORD_MESSAGE_TEMPLATE
    .replace('%username%', username)
    .replace('%message%', message)
}

function makeDiscordWebhook (username, message) {
  message = replaceDiscordMentions(message)

  var avatarURL = ''
  if (username === c.SERVER_NAME + ' - Server') { // Use avatar for the server
    avatarURL = `https://cdn6.aptoide.com/imgs/8/e/d/8ede957333544a11f75df4518b501bdb_icon.png?w=256`
  } else { // Use avatar for player
    avatarURL = `https://minotar.net/helm/${username}/256.png`
  }

  return {
    username: username,
    content: message,
    'avatar_url': avatarURL
  }
}

function makeMinecraftTellraw (message) {
  // same as the discord side but with discord message parameters
  const username = emojiStrip(message.author.username)
  const discriminator = message.author.discriminator
  const text = emojiStrip(message.cleanContent)
  // hastily use JSON to encode the strings
  const variables = JSON.parse(JSON.stringify({ username, discriminator, text }))

  return c.MINECRAFT_TELLRAW_TEMPLATE
    .replace('%username%', variables.username)
    .replace('%discriminator%', variables.discriminator)
    .replace('%message%', variables.text)
}

const debug = c.DEBUG
const shulker = new Discord.Client()

function initApp () {
  // run a server if not local
  if (!c.IS_LOCAL_FILE) {
    app = express()
    const http = require('http').Server(app)

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

    const serverport = process.env.PORT || c.PORT

    http.listen(serverport, function () {
      console.log('[INFO] Bot listening on *:' + serverport)
    })
  } else {
    if (fs.existsSync(c.LOCAL_FILE_PATH)) {
      console.log('[INFO] Using configuration for local file at "' + c.LOCAL_FILE_PATH + '"')
      tail = new Tail(c.LOCAL_FILE_PATH)
    } else {
      throw new Error('[ERROR] Local file not found at "' + c.LOCAL_FILE_PATH + '"')
    }
  }
}

function getWordAt (str, pos) {
    // Perform type conversions.
    str = String(str);
    pos = Number(pos) >>> 0;

    // Search for the word's beginning and end.
    var left = str.slice(0, pos + 1).search(/\S+$/),
      right = str.slice(pos).search(/\s/);

    // The last word in the string is a special case.
    if (right < 0) {
      return str.slice(left);
    }

    // Return the word, using the located bounds to extract it from the string.
    return str.slice(left, right + pos);
}

function convertToServerMessage(data){
  // Get username of player
  var username = getWordAt(data, 33)
  // Change the "Username" field to the server's name and place the player's usename in the message body.
  data = data.replace(username, "<" + c.SERVER_NAME + " - Server> " + username)
  return(data)
}

function parseLogLine(data){
  // Check if the data is a chat message
  if (data.indexOf(': <') !== -1) {
    if (debug){
      console.log('[Debug]: A player sent a chat message')
    }
    return(data)
  }

  // Check if the data is a player joining or leaving (if enabled)
  else if (c.SHOW_PLAYER_CONN_STAT && (data.indexOf('left the game') !== -1 || data.indexOf('joined the game') !== -1)){
    if (debug){
      console.log('[Debug]: A player\'s connection status changed')
    }
    data = convertToServerMessage(data)
    return(data)
  }

  // Check if the data is a player earning an achievement (if enabled)
  else if (c.SHOW_PLAYER_ACHV && data.indexOf('has just earned the achievement') !== -1){
    if (debug){
      console.log('[Debug] A player has earned an achievement')
    }
    data = convertToServerMessage(data)
    return(data)
  }

  // Check if the data is a player death (if enabled)
  else if (c.SHOW_PLAYER_DEATH){
    // Check for a match of any DEATH_KEY_WORDS
    for (var index = 0; index < c.DEATH_KEY_WORDS.length; index++){
      if (data.indexOf(c.DEATH_KEY_WORDS[index]) !== -1){
        if (debug){
          console.log('[DEBUG] A player died. Matched key word \"' + c.DEATH_KEY_WORDS[index] + "\"");
        }
        data = convertToServerMessage(data)
        return(data)
      }
    }
  }

  // Otherwise return blank
  data = ''
  return(data)
}

function watch (callback) {
  if (c.IS_LOCAL_FILE) {
    tail.on('line', function (data) {
      data = parseLogLine(data)
      if (data != '') {
        callback(data)
      }
    })
  } else {
    app.post(c.WEBHOOK, function (request, response) {
      callback(request.rawBody)
      response.send('')
    })
  }
}

shulker.on('ready', function () {
  watch(function (body) {
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

initApp()
shulker.login(c.DISCORD_TOKEN)
