# shulker

> Connects [Discord](https://discordapp.com/) and [Minecraft](https://minecraft.net) Servers by sending messages back and forth without any mods or plugins.

## In Action
![discord-mc](http://i.thedestruc7i0n.ca/I5anbg.gif)

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

Clone repository onto a server, edit ```config.json``` (see below for more info) and change any options, and then, in the repository folder:
```sh
$ yarn
$ yarn start
```

If you are running this locally, check the `IS_LOCAL_FILE` flag and related options below. Otherwise, perform the following command:
On your server hosting (in a screen/tmux session or background process, make sure to replace your `YOUR_URL` with whatever URL you're using (`localhost:8000` if running on the same server and default config) and `PATH_TO_MINECRAFT_SERVER_INSTALL` with the path to the Minecraft server installation, such as `/usr/home/minecraft_server/`):

``` sh
tail -F /PATH_TO_MINECRAFT_SERVER_INSTALL/logs/latest.log | grep --line-buffered ": <" | while read x ; do echo -ne $x | curl -X POST -d @- http://YOUR_URL/minecraft/hook ; done
```

You can also easily Deploy to Heroku and the like, just be sure to edit `YOUR_URL` in the command to match accordingly.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)


### Configuration
```js
{
    "PORT": 8000, /* Port you want to run the webserver for the hook on */

    "USE_WEBHOOKS": true, /* If you want to use snazzy webhooks */
    "WEBHOOK_URL": "DISCORD_WEBHOOK_URL_HERE", /* Be sure to create a webhook in the channel settings and place it here! */
    "DISCORD_TOKEN": "<12345>", /* Discord bot token. [Click here](https://discordapp.com/developers/applications/me) to create you application and add a bot to it. */
    "DISCORD_CHANNEL_ID": "<channel>", /* Discord channel ID for for the discord bot. Enable developer mode in your Discord client, then right click channel and select "Copy ID". */
    "DISCORD_MESSAGE_TEMPLATE": "`%username%`:%message%", /* Message template to display in Discord */

    "MINECRAFT_SERVER_RCON_IP": "127.0.0.1", /* Minecraft server IP (make sure you have enabled rcon) */
    "MINECRAFT_SERVER_RCON_PORT": <1-65535>, /* Minecraft server rcon port */
    "MINECRAFT_SERVER_RCON_PASSWORD": "<your password>", /* Minecraft server rcon password */
    "MINECRAFT_TELLRAW_TEMPLATE": "[{\"color\": \"white\", \"text\": \"<%username%> %message%\"}]", /* Tellraw template to display in Minecraft */

    "IS_LOCAL_FILE": false, /* should tail the local file, may be a little buggy. please report any you find */
    "LOCAL_FILE_PATH": "/usr/home/minecraft_server/logs/latest.log", /* the path to the local file if specified */
    "ALLOW_USER_MENTIONS": false, /* should replace @mentions with the mention in discord */

    "WEBHOOK": "/minecraft/hook", /* Web hook, where to send the log to */
    "REGEX_MATCH_CHAT_MC": "\\[Server thread/INFO\\]: <(.*)> (.*)", /* What to match for chat (best to leave as default) */
    "REGEX_IGNORED_CHAT": "packets too frequently", /* What to ignore, you can put any regex for swear words for example and it will  be ignored */
    "DEBUG": false, /* Dev debugging */

    "SERVER_NAME" : "Shulker", /* The username used when displaying any server information in chat, e.g., Server - Shulker : Server message here*/
    "SHOW_PLAYER_CONN_STAT" : false, /* Shows player connection status in chat, e.g., Server - Shulker : TheMachine joined the game */
    "SHOW_PLAYER_ACHV" : false, /* Shows when players earn achievements in chat, e.g., Server - Shulker : TheMachine has earned the achievement [MEME - Machine] */
    "SHOW_PLAYER_DEATH" : false, /* Shows when players die in chat, e.g., Server - Shulker : TheMachine was blown up by creeper */
    "DEATH_KEY_WORDS" : ["shot", "fell", "etc".] /* Key words to look for when trying to identify a death message. (As of 3/11/2019 this list is up to date) */
}
```

## Upcoming
None

## Suggestions
If you have any suggestions or feature requests, feel free to add an issue and I will take a look and possibly add it to the "Upcoming" section!

## Thanks
* [hydrabolt](https://github.com/hydrabolt) for discord.js
* [qrush](https://github.com/qrush) for the idea of this ([wither](https://github.com/qrush/wither))
* [SecretOnline](https://github.com/secretonline) for Rcon reconnecting and for making it only send messages in specified channel

## License

ISC. See `LICENSE`.
