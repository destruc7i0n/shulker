# shulker

> Connects [Discord](https://discordapp.com/) and [Minecraft](https://minecraft.net) Servers by sending messages back and forth without any mods or plugins.

## Notice
This project has recently gone under a rewrite and the format for `config.json` is not directly backwards compatible with previous versions.
See [below](#upgrade-instructions) for details.

## In Action
![discord-mc](http://i.thedestruc7i0n.ca/I5anbg.gif)

## Features
- Sends message to and from Vanilla Minecraft servers
- Can send messages regarding advancements, when players join and leave, and player deaths
- Allows admins to send commands to Minecraft through Discord
 
## Installation and usage

Create a Discord bot here: https://discordapp.com/developers/applications/me

Then, add the bot to your Discord server using the following link, replace the Client ID with that of your bot.
```
https://discordapp.com/oauth2/authorize?client_id=<CLIENT ID>&scope=bot
```

In your Minecraft server.properties, make sure you have the following and restart the server:
```
enable-rcon=true
rcon.password=<your password>
rcon.port=<1-65535>
```

Clone repository onto a server, edit ```config.json``` (see below for more info) and change any options.
Then, in the repository folder:
```sh
$ yarn
$ yarn build && yarn start
```

If you are running this on the same server as the MC server, enable the `IS_LOCAL_FILE` flag and update related options below.
Otherwise, perform the following command on the server hosting (in a screen/tmux session or background process, make sure to replace your `YOUR_URL` with whatever URL you're using (`localhost:8000` if running on the same server and default config) and `PATH_TO_MINECRAFT_SERVER_INSTALL` with the path to the Minecraft server installation, such as `/usr/home/minecraft_server/`):

``` sh
tail -F /PATH_TO_MINECRAFT_SERVER_INSTALL/logs/latest.log | grep --line-buffered ": <" | while read x ; do echo -ne $x | curl -X POST -d @- http://YOUR_URL/minecraft/hook ; done
```
(The above command will also be given to you if you are not using a local file when you start up Shulker)

You can also easily Deploy to Heroku and the like, just be sure to edit `YOUR_URL` in the command to match accordingly.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)


### Configuration
```js
{
    "PORT": 8000, /* Port you want to run the webserver for the hook on */
    
    "USE_WEBHOOKS": true, /* If you want to use snazzy webhooks */
    "WEBHOOK_URL": "DISCORD_WEBHOOK_URL_HERE", /* Be sure to create a webhook in the channel settings and place it here! */
    "IGNORE_WEBHOOKS": true, /* Ignore any messages that are sent by webhooks. If disabled, then all webhooks but those sent from the configured webhook will be handled as well */
    "DISCORD_TOKEN": "<12345>", /* Discord bot token. [Click here](https://discordapp.com/developers/applications/me) to create you application and add a bot to it. */
    "DISCORD_CHANNEL_ID": "<channel>", /* Discord channel ID for for the discord bot. Enable developer mode in your Discord client, then right click channel and select "Copy ID". */
    "DISCORD_CHANNEL_NAME": "#<channel name>" /* The Discord channel name. It is recommended to use the ID if the bot is in multiple servers. The ID will take precedence. */
    "DISCORD_MESSAGE_TEMPLATE": "`%username%`:%message%", /* Message template to display in Discord */
    
    "MINECRAFT_SERVER_RCON_IP": "127.0.0.1", /* Minecraft server IP (make sure you have enabled rcon) */
    "MINECRAFT_SERVER_RCON_PORT": <1-65535>, /* Minecraft server rcon port */
    "MINECRAFT_SERVER_RCON_PASSWORD": "<your password>", /* Minecraft server rcon password */
    "MINECRAFT_TELLRAW_TEMPLATE": "[{\"color\": \"white\", \"text\": \"<%username%> %message%\"}]", /* Tellraw template to display in Minecraft */
    
    "IS_LOCAL_FILE": false, /* should tail the local file, may be a little buggy. please report any you find */
    "LOCAL_FILE_PATH": "/usr/home/minecraft_server/logs/latest.log", /* the path to the local file if specified */

    "SHOW_INIT_MESSAGE": true, /* Sends the message on boot if not a local file of what command to run */ 

    "ALLOW_USER_MENTIONS": false, /* should replace @mentions with the mention in discord (format: @username#discriminator) */
    "ALLOW_HERE_EVERYONE_MENTIONS": false, /* replaces @everyone and @here with "@ everyone" and "@ here" respectively */
    "ALLOW_SLASH_COMMANDS": false, /* whether to allow users to run slash commands from discord */
    "SLASH_COMMAND_ROLES": [], /* if the above is enabled, the names of the roles which can run slash commands */
    
    "WEBHOOK": "/minecraft/hook", /* Web hook, where to send the log to */
    "REGEX_SERVER_PREFIX": "\\[Server thread/INFO\\]:", /* What the lines of the log should start with */
    "REGEX_MATCH_CHAT_MC": "^<([^>]*)> (.*)", /* What to match for chat (best to leave as default) */
    "REGEX_IGNORED_CHAT": "packets too frequently", /* What to ignore, you can put any regex for swear words for example and it will  be ignored */
    "DEBUG": false, /* Dev debugging */

    "SERVER_IMAGE": "", /* Image for the server when sending such messages (if enabled below). Only for WebHooks. */
    "SERVER_NAME": "Shulker", /* The username used when displaying any server information in chat, e.g., Shulker - Server : Server message here*/
    "PLAYERCOUNT_IN_SERVERNAME": false, /* Will add the number of players currently in the server to the server username e.g., Shulker - Server - 1 online : Server message here*/
    "PLAYERCOUNT": 0, /* For most cases you can leave this at 0 but if you are starting Shulker when there are already players in the server set this to the current number of players online if this is incorrectly set it will tautomatically fix itself once the server hits 0 players*/
    "SHOW_PLAYER_CONN_STAT": false, /* Shows player connection status in chat, e.g., Server - Shulker : TheMachine joined the game */
    "SHOW_PLAYER_ADVANCEMENT": false, /* Shows when players earn advancements in chat, e.g., Server - Shulker : TheMachine has made the advacement [MEME - Machine] */
    "SHOW_PLAYER_DEATH": false, /* Shows when players die in chat, e.g., Server - Shulker : TheMachine was blown up by creeper */
    "SHOW_PLAYER_ME": false, /* Shows when players use the /me command, e.g. **destruc7i0n** says hello */
    "DEATH_KEY_WORDS": ["shot", "fell", "etc".] /* Key words to look for when trying to identify a death message. (As of 3/11/2019 this list is up to date) */
}
```

## FAQ
* How do I make this work on a modded server?
  - Try replacing `REGEX_SERVER_PREFIX` with `"\\[Server thread/INFO\\] \\[.*\\]:"`
  
* Why can't I send commands even if I have the option enabled?
  - Make sure that you have a role on the server which is put in the array `SLASH_COMMAND_ROLES` case-sensitive.
    - e.g. `"SLASH_COMMAND_ROLES": ["Admin"]`

## Upgrade Instructions
From version 2 to version 3:
- The main change is that you need to split your `REGEX_MATCH_CHAT_MC` to both `REGEX_MATCH_CHAT_MC` and `REGEX_SERVER_PREFIX`.
  See the [configuration](#configuration) above for details.

## Upcoming
None

## Suggestions
If you have any suggestions or feature requests, feel free to add an issue and I will take a look.

## Thanks
* [hydrabolt](https://github.com/hydrabolt) for discord.js
* [qrush](https://github.com/qrush) for the idea of this ([wither](https://github.com/qrush/wither))
* [SecretOnline](https://github.com/secretonline) for Rcon reconnecting and for making it only send messages in specified channel
* [TheZackCodec](https://github.com/TheZackCodec/) for the updates in server based messages

## License

ISC. See `LICENSE`.
