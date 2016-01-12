# shulker

![shulker](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAB/CAMAAAAQJDo1AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAP1BMVEV/Wn+PZo9/WH+PZI9/Vn93V3d3Und3VHeHXoeXZpeHW4eXapeXaZeHXIdwUHCHYIdwTnCXZZePY493UHf////SMtiMAAAAAWJLR0QUkt/JNQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAAAd0SU1FB+ABDA4wIEOQHBsAAAF8SURBVGje7Zu9UgMxDAaP8JNADgjw/u9Ko73iy2gcyEycYre0jLQ0Gtm+LEvxEOwK4o8B609FFydPxp+LRQEFFJguwMJLsS8OAevs+28ctn9QAQUUmC5A48nCr0Em7OJvxbFYi/eCOjQwBRRQYL4AZGISZKE16PYdG6jzUSiggALzBWgIBNYLIeGlQvBZnAoFFFBgvgAHk9FA0hUcNSogL3W2DqiAAgpMF+gOJt1A8VV0Ip1YCgwvKBRQQIGbCXQHk2vpxKizDSQKKKDA3Qlko+kaUhbMgaUTU0ABBe5PIA8mXCD8deDo9iOWDxZnL6cKKKDANIHvgg8P2Lg2ZEPq9nUNCIHt4VIBBRSYLpADSZeIQSUbzEgoG9VwIlJAAQVuLsBgQIBElxbKhrMOUEABBe5PIB8s8oNEEh+CUTyFOPAw+LQvJgoooMDNBbig+CnyBwp5scC+LLgPWKdwxs++oFBAAQWmCeQCFwenYBdkPC8cWOcD5u7vFVBAgV//pDE3gFk7XgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxNi0wMS0xMlQxNDo0ODozMi0wNTowMNlD1kQAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTYtMDEtMTJUMTQ6NDg6MzItMDU6MDCoHm74AAAAGHRFWHRTb2Z0d2FyZQBwYWludC5uZXQgNC4wLjVlhTJlAAAAAElFTkSuQmCC)

[![Build Status](https://david-dm.org/destruc7i0n/shulker.svg)](https://david-dm.org/destruc7i0n/shulker)
[![Build Status](https://travis-ci.org/destruc7i0n/shulker.svg?branch=master)](https://travis-ci.org/destruc7i0n/shulker)
[![Circle CI](https://circleci.com/gh/destruc7i0n/shulker.svg?style=shield)](https://circleci.com/gh/destruc7i0n/shulker)

> Connects [Discord](https://discordapp.com/) and [Minecraft](https://minecraft.net) Servers by sending messages back and forth without any mods or plugins.

## In Action
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
    "DISCORD_EMAIL": "example@example.com", /* discord email */
    "DISCORD_PASSWORD": "password123", /* discord password */
    "DISCORD_CHANNEL": "general", /* channel for discord bot */
    "MINECRAFT_SERVER_RCON_IP": "example.com", /* minecraft server ip (make sure you have enabled rcon) */
    "MINECRAFT_SERVER_RCON_PORT": <1-65535>, /* minecraft server rcon port */
    "MINECRAFT_SERVER_RCON_PASSWORD": "<your password>", /* minecraft server rcon password */
    "WEBHOOK": "/minecraft/hook", /* web hook, where to send the log to */
    "REGEX_MATCH_CHAT_MC": "\\[Server thread/INFO\\]: <(.*)> (.*)", /* what to match for chat (best to leave as default) */
    "REGEX_IGNORED_CHAT": "packets too frequently", /* what to ignore, you can put any regex for swear words for example and it will */ be ignored
    "DEBUG": false /* dev debugging */
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

## Thanks
* [hydrabolt](https://github.com/hydrabolt) for discord.js
* [qrush](https://github.com/qrush) for the idea of this ([wither](https://github.com/qrush/wither))

## License

ISC. See `LICENSE`.
