/*jslint bitwise: true, node: true */

var Discord = require("discord.js");
var Rcon = require("rcon");
var express = require("express");
var app = express(); 
var http = require("http").Server(app); 
var c = require("./config.json");
var debug = c.DEBUG;
var d2m = new Discord.Client();

var client = new Rcon(c.MINECRAFT_SERVER_RCON_IP, c.MINECRAFT_SERVER_RCON_PORT, c.MINECRAFT_SERVER_RCON_PASSWORD);

client.on("auth", function() {
    if(debug) {
        console.log("[DEBUG] Authenticated with "+c.MINECRAFT_SERVER_RCON_IP+":"+c.MINECRAFT_SERVER_RCON_PORT);
    }
}).on("response", function(str) {
    if(debug && str) {
        console.log("[DEBUG] Got response: " + str);
    }
}).on("end", function() {
    if(debug) {
        console.log("[DEBUG] Rcon closed!");
    }
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

d2m.on("ready", function() {
    var channel = d2m.channels.get("name", c.DISCORD_CHANNEL).id; 
    app.post(c.WEBHOOK, function(request, response){
        body = request.rawBody;
        if(debug) {
            console.log("[DEBUG] Recieved "+body);  
        }
        re = new RegExp(c.REGEX_MATCH_CHAT_MC);
        ignored = new RegExp(c.REGEX_IGNORED_CHAT);
        if(!ignored.test(body)) {
            bodymatch = body.match(re);
            if(debug) {
                console.log("[DEBUG] Username: "+bodymatch[1]);
                console.log("[DEBUG] Text: "+bodymatch[2]);
            }
            message = "**"+bodymatch[1]+"**: "+bodymatch[2];
            d2m.channels.get("id", channel).sendMessage(message);
        }
        response.send("");
    });
});

d2m.on("message", function (message) {
    if(message.author.id !== d2m.user.id) {
        data = { text: "<"+message.author.username+"> "+message.content };
        client.send('tellraw @a ["",'+JSON.stringify(data)+']');
    }
});

d2m.login(c.DISCORD_EMAIL, c.DISCORD_PASSWORD);

var ipaddress = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || "127.0.0.1";
var serverport = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || c.PORT;
if (process.env.OPENSHIFT_NODEJS_IP !== undefined) {
    http.listen( serverport, ipaddress, function() {
        console.log("[DEBUG] Bot listening on *:" + serverport);
    });
} else {
    http.listen( serverport, function() {
        console.log("[DEBUG] Bot listening on *:" + c.PORT);
    });
}