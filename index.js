/*jslint bitwise: true, node: true */
'use strict';

var Discord = require("discord.js");
var Rcon = require("./lib/rcon.js");
var express = require("express");
var app = express();
var http = require("http").Server(app);

var cfile = (process.argv.length > 2) ? process.argv[2] : "./config.json"

console.log("[INFO] Using configuration file:", cfile);

var c = require(cfile);

function makeTellraw(message) {
    // make a tellraw string by formatting the configured template with the given message
    return c.MINECRAFT_TELLRAW_TEMPLATE
        .replace("%username%", message.author.username)
        .replace("%discriminator%", message.author.discriminator)
        .replace("%message%", message.cleanContent);
}

var debug = c.DEBUG;
var shulker = new Discord.Client();

var rconTimeout;

app.use(function(request, response, next) {
    request.rawBody = "";
    request.setEncoding("utf8");

    request.on("data", function(chunk) {
        request.rawBody += chunk;
    });

    request.on("end", function() {
        next();
    });
});

shulker.on("ready", function() {
    var channel = c.DISCORD_CHANNEL_ID;
    app.post(c.WEBHOOK, function(request, response) {
        var body = request.rawBody;
        console.log("[INFO] Recieved " + body);
        var re = new RegExp(c.REGEX_MATCH_CHAT_MC);
        var ignored = new RegExp(c.REGEX_IGNORED_CHAT);
        if (!ignored.test(body)) {
            var bodymatch = body.match(re);
            if (debug) {
                console.log("[DEBUG] Username: " + bodymatch[1]);
                console.log("[DEBUG] Text: " + bodymatch[2]);
            }
            var message = "`" + bodymatch[1].replace(/(\§[A-Z-a-z-0-9])/g, "") + "`:" + bodymatch[2];
            shulker.channels.get(channel).sendMessage(message);
        }
        response.send("");
    });
});

shulker.on("message", function(message) {
    if (message.channel.id === shulker.channels.get(c.DISCORD_CHANNEL_ID).id) {
        if (message.author.id !== shulker.user.id) {
            var client = new Rcon(c.MINECRAFT_SERVER_RCON_IP, c.MINECRAFT_SERVER_RCON_PORT); // create rcon client
            client.auth(c.MINECRAFT_SERVER_RCON_PASSWORD, function(err){ // only authenticate when needed
                client.command('tellraw @a ' + makeTellraw(message), function(err, resp) {
                    client.close(); // close the rcon connection
                });
            });
        }
    }
});

shulker.login(c.DISCORD_TOKEN);

var ipaddress = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || "127.0.0.1";
var serverport = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || c.PORT;
if (process.env.OPENSHIFT_NODEJS_IP !== undefined) {
    http.listen(serverport, ipaddress, function() {
        console.log("[INFO] Bot listening on *:" + serverport);
    });
} else {
    http.listen(serverport, function() {
        console.log("[INFO] Bot listening on *:" + c.PORT);
    });
}
