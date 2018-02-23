# shulker

> Connects [Discord](https://discordapp.com/) and [Minecraft](https://minecraft.net) Servers by sending messages back and forth without any mods or plugins.

## In Action
![discord-irc](http://i.thedestruc7i0n.ca/I5anbg.gif)

## Installation and usage

In your Minecraft server.properties, make sure you have and restart the server:
```
enable-rcon=true
rcon.password=<your password>
rcon.port=<1-65535>
```

Clone repository onto a server, edit ```config.json``` (see below for more info) and change any options, and then, in the repository folder:
```sh
$ npm install
$ npm start
```

Run the following on your server hosting (in a screen/tmux session or background process, make sure to replace your `YOUR_URL` with whatever URL you're using (`localhost:8000` if running on the same server and default config) and `PATH_TO_MINECRAFT_INSTALL` with the path to the Minecraft server installation, such as `/usr/home/minecraft_server/`):

``` sh
tail -F /PATH_TO_MINECRAFT_INSTALL/logs/latest.log | grep --line-buffered ": <" | while read x ; do echo -ne $x | curl -X POST -d @- http://YOUR_URL/minecraft/hook ; done
```

You can also easily Deploy to Heroku or Bluemix, just be sure to edit `YOUR_URL` in the command to match accordingly.

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
    "MINECRAFT_TELLRAW_TEMPLATE": "[{\"color\": \"gray\", \"text\": \"[%username%#%discriminator%] \"},{\"color\": \"white\", \"text\": \"%message%\"}]", /* Tellraw command format to display in-game */
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
None

## Suggestions
If you have any suggestions or feature requests, feel free to add an issue and I will take a look and possibly add it to the "Upcoming" section!

## Thanks
* [hydrabolt](https://github.com/hydrabolt) for discord.js
* [qrush](https://github.com/qrush) for the idea of this ([wither](https://github.com/qrush/wither))
* [SecretOnline](https://github.com/secretonline) for Rcon reconnecting and for making it only send messages in specified channel

## License

ISC. See `LICENSE`.
