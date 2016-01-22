/*jslint bitwise: true, node: true */
'use strict';

var Discord = require("discord.js");
var Rcon = require("rcon");
var express = require("express");
var app = express();
var http = require("http").Server(app);
var c = require("./config.json");
var debug = c.DEBUG;
var shulker = new Discord.Client();

var client = new Rcon(c.MINECRAFT_SERVER_RCON_IP, c.MINECRAFT_SERVER_RCON_PORT, c.MINECRAFT_SERVER_RCON_PASSWORD);

client.on("auth", function() {
    console.log("[INFO] Authenticated with " + c.MINECRAFT_SERVER_RCON_IP + ":" + c.MINECRAFT_SERVER_RCON_PORT);
}).on("response", function(str) {
    if (debug && str) {
        console.log("[DEBUG] Got response: " + str);
    }
}).on("end", function() {
    console.log("[INFO] Rcon closed!");
});

client.connect();

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
    var channel = shulker.channels.get("name", c.DISCORD_CHANNEL).id;
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
            var message = "**" + bodymatch[1] + "**: " + bodymatch[2];
            shulker.channels.get("id", channel).sendMessage(message);
        }
        response.send("");
    });
});

shulker.on("message", function(message) {
    if (message.channel.id === shulker.channels.get("name", c.DISCORD_CHANNEL).id) {
        if (message.author.id !== shulker.user.id) {
            var data = {
                text: "<" + message.author.username + "> " + message.content
            };
            client.send('tellraw @a ["",' + JSON.stringify(data) + ']');
        }
    }
});

shulker.login(c.DISCORD_EMAIL, c.DISCORD_PASSWORD);

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
