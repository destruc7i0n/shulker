# shulker

[![Build Status](https://david-dm.org/destruc7i0n/shulker.svg)](https://david-dm.org/destruc7i0n/shulker)
[![Build Status](https://travis-ci.org/destruc7i0n/shulker.svg?branch=master)](https://travis-ci.org/destruc7i0n/shulker)
[![Circle CI](https://circleci.com/gh/destruc7i0n/shulker.svg?style=shield)](https://circleci.com/gh/destruc7i0n/shulker)

> Connects [Discord](https://discordapp.com/) and [Minecraft](https://minecraft.net) Servers by sending messages back and forth without any mods or plugins.

## In Action
![discord-irc](http://i.thedestruc7i0n.ca/I5anbg.gif)

## Installation and usage

In your Minecraft server.properties, make sure you have:
```
enable-rcon=true
rcon.password=<your password>
rcon.port=<1-65535>
```

Run the following on your server hosting (in a screen/tmux session or background process, and make sure to replace your URL and your log directory location):

``` sh
tail -F /PATH_TO_MINECRAFT_INSTALL/logs/latest.log | grep --line-buffered ": <" | while read x ; do echo -ne $x | curl -X POST -d @- https://YOUR_URL/minecraft/hook ; done
```

Clone repository onto a server, edit ```config.json``` (see below for more info) and change any options, and then, in the repository folder:
```sh
$ npm install
$ npm start
```
You can also easily Deploy to Heroku or Bluemix.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)
[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/destruc7i0n/shulker)


### Configuration
```js
{
    "PORT": 8000, /* Port you want to run the webserver for the hook on */
    "DISCORD_TOKEN": "<12345>", /* Discord bot token. [Click here](https://discordapp.com/developers/applications/me) to create you application and add a bot to it. */
    "DISCORD_CHANNEL_ID": "<12345>", /* Discord channel ID for for the discord bot. Enable developer mode in your Discord client, then right click channel and select "Copy ID". */
    "MINECRAFT_SERVER_RCON_IP": "example.com", /* Minecraft server IP (make sure you have enabled rcon) */
    "MINECRAFT_SERVER_RCON_PORT": <1-65535>, /* Minecraft server rcon port */
    "MINECRAFT_SERVER_RCON_PASSWORD": "<your password>", /* Minecraft server rcon password */
    "WEBHOOK": "/minecraft/hook", /* Web hook, where to send the log to */
    "REGEX_MATCH_CHAT_MC": "\\[Server thread/INFO\\]: <(.*)> (.*)", /* What to match for chat (best to leave as default) */
    "REGEX_IGNORED_CHAT": "packets too frequently", /* What to ignore, you can put any regex for swear words for example and it will  be ignored */
    "DEBUG": false /* Dev debugging */
}
```


## Tests
Run the tests with:
```bash
$ npm test
```

## Upcoming
* A "merge accounts" function to allow Minecraft players to associate their Discord accounts with their Minecraft accounts so that usernames are accurate
* Ability to post messages to Discord on behalf of Discord users, rather than using a bot user (hopefully after the official API is released)

## Suggestions
If you have any suggestions or feature requests, feel free to add an issue and I will take a look and possibly add it to the "Upcoming" section!

## Thanks
* [hydrabolt](https://github.com/hydrabolt) for discord.js
* [qrush](https://github.com/qrush) for the idea of this ([wither](https://github.com/qrush/wither))
* [SecretOnline](https://github.com/secretonline) for Rcon reconnecting and for making it only send messages in specified channel

## License

ISC. See `LICENSE`.
