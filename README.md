# shulker

[![Build Status](https://david-dm.org/destruc7i0n/shulker.svg)](https://david-dm.org/destruc7i0n/shulker)
[![Build Status](https://travis-ci.org/destruc7i0n/shulker.svg?branch=master)](https://travis-ci.org/destruc7i0n/shulker)
[![Circle CI](https://circleci.com/gh/destruc7i0n/shulker.svg?style=shield)](https://circleci.com/gh/destruc7i0n/shulker)

> Connects [Discord](https://discordapp.com/) and [Minecraft](https://minecraft.net) Servers by sending messages back and forth without any mods or plugins.

## In Action
![discord-irc](http://s.thedestruc7i0n.ca/p/I5anbg.gif)

## Installation and usage

This branch can use rcon or it will use the player to chat, set in ```config.json``` (see below). This also uses a player instead of a tail command.

If you use RCON, set in your Minecraft server.properties:
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
You can also easily Deploy to Heroku or Bluemix.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)
[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/destruc7i0n/shulker)


### Configuration
```js
{
    "DISCORD_EMAIL": "mail@example.com", /* discord email */
    "DISCORD_PASSWORD": "example", /* discord password */
    "DISCORD_CHANNEL": "general", /* discord channel */
    
    "MINECRAFT_USERNAME": "searge@gmail.com", /* mc username */
    "MINECRAFT_USER_PASSWORD": "seargerules", /* mc password */
    
    "MINECRAFT_SERVER_IP": "example.com", /* server ip */
    "MINECRAFT_SERVER_PORT": 25565, /* server port */
    
    "USE_RCON": false, /* want to use rcon? set the below if so */
    "MINECRAFT_SERVER_RCON_IP": "example.com", /* rcon ip */
    "MINECRAFT_SERVER_RCON_PORT": 25575, /* rcon port */
    "MINECRAFT_SERVER_RCON_PASSWORD": "password", /* rcon pass */
   
    "REGEX_IGNORED_CHAT": "packets too frequently", /* ignored */
    
    "DEBUG": false /* for dev */
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

## License

ISC. See `LICENSE`.
