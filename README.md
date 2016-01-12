# shulker

[![Build Status](https://david-dm.org/destruc7i0n/shulker.svg)](https://david-dm.org/destruc7i0n/shulker)
[![Build Status](https://travis-ci.org/destruc7i0n/shulker.svg?branch=master)](https://travis-ci.org/destruc7i0n/shulker)

> Connects [Discord](https://discordapp.com/) and Minecraft Servers by sending messages back and forth.

## Example
![discord-irc](http://i.giphy.com/6yj4FRw3XZt6M.gif)

## Installation and usage

In your Minecraft server.properties, make sure you have:
```
enable-rcon=true
rcon.password=<your password>
rcon.port=<1-65535>
```

Run the following on your server hosting (in a screen, and make sure to replace your URL and your log directory location):

``` sh
tail -F /PATH_TO_MINECRAFT_INSTALL/logs/latest.log | grep --line-buffered ": <" | while read x ; do echo -ne $x | curl -X POST -d @- https://YOUR_URL/minecraft/hook ; done
```

Clone repository onto a server, edit ```config.json``` and change any options, and then,
```bash
In the repository folder:
$ npm install
$ npm start
```
You can also easily Deploy to Heroku.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

### Default configuration
```js
{
    "PORT": 8000, # Port you want to run the webserver for the hook on
    "DISCORD_EMAIL": "example@example.com", # discord email
    "DISCORD_PASSWORD": "password123", # discord password
    "DISCORD_CHANNEL": "general", # channel for discord bot
    "MINECRAFT_SERVER_RCON_IP": "example.com", # minecraft server ip (make sure you have enabled rcon)
    "MINECRAFT_SERVER_RCON_PORT": <1-65535>, # minecraft server rcon port 
    "MINECRAFT_SERVER_RCON_PASSWORD": "<your password>", # minecraft server rcon password
    "WEBHOOK": "/minecraft/hook", # web hook, where to send the log to
    "REGEX_MATCH_CHAT_MC": "\\[Server thread/INFO\\]: <(.*)> (.*)", # what to match for chat (best to leave as default)
    "REGEX_IGNORED_CHAT": "packets too frequently", # what to ignore, you can put any regex for swear words for example and it will be ignored
    "DEBUG": false # dev debugging
}
```


## Tests
Run the tests with:
```bash
$ npm test
```

## License

ISC. See `LICENSE`.
