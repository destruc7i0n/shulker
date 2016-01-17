/*jslint bitwise: true, node: true */

var Discord = require("discord.js");
var Rcon = require("rcon");
var mineflayer = require("mineflayer");
var c = require("./config.json");
var debug = c.DEBUG;
var shulker = new Discord.Client();

var channel;

if(c.USE_RCON) {
    var client = new Rcon(c.MINECRAFT_SERVER_RCON_IP, c.MINECRAFT_SERVER_RCON_PORT, c.MINECRAFT_SERVER_RCON_PASSWORD);

    client.on("auth", function() {
        console.log("[INFO] Authenticated with "+c.MINECRAFT_SERVER_RCON_IP+":"+c.MINECRAFT_SERVER_RCON_PORT);
    }).on("response", function(str) {
        if(debug && str) {
            console.log("[DEBUG] Got response: " + str);
        }
    }).on("end", function() {
        console.log("[INFO] Rcon closed!");
    });

    client.connect();
}

var bot = mineflayer.createBot({
    host: c.MINECRAFT_SERVER_IP,
    port: c.MINECRAFT_SERVER_PORT,       
    username: c.MINECRAFT_USERNAME, 
    password: c.MINECRAFT_USER_PASSWORD,          
});

shulker.on("ready", function() {
    channel = shulker.channels.get("name", c.DISCORD_CHANNEL).id; 
});

bot.on("chat", function(username, message) { 
    ignored = new RegExp(c.REGEX_IGNORED_CHAT);
    if(!ignored.test(message)) {
        if(debug) {
            console.log("[DEBUG] Username: "+username);
            console.log("[DEBUG] Text: "+message);
        }
        message = "**"+username+"**: "+message;
        shulker.channels.get("id", channel).sendMessage(message);
    }
});

bot.on("login", function() {
    console.log("[INFO] Logged user onto "+c.MINECRAFT_SERVER_IP+":"+c.MINECRAFT_SERVER_PORT);
});

bot.on("kicked", function(reason) {
    console.log("[INFO] Kicked "+reason);
})

bot.on("end", function() {
    console.log("[INFO] Logged out of "+c.MINECRAFT_SERVER_IP+":"+c.MINECRAFT_SERVER_PORT)
})

shulker.on("message", function (message) {
    if(message.author.id !== shulker.user.id) {
        if(c.USE_RCON) {
            data = { text: "<"+message.author.username+"> "+message.content };
            client.send('tellraw @a ["",'+JSON.stringify(data)+']');
        } else {
            bot.chat(message.content);
        }
    }
});

shulker.login(c.DISCORD_EMAIL, c.DISCORD_PASSWORD);
