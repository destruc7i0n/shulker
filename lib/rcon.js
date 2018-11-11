// Credits to M4GNV5 for this library to reduce dependencies

const net = require('net')
const c = require('../config.json')
const debug = c.DEBUG

module.exports = Rcon

function Rcon (ip, port) {
  const self = this
  self.rconTimeout = undefined
  self.nextId = 0
  self.connected = false
  self.authed = false
  self.packages = []

  self.socket = net.connect(port, ip, function () {
    self.connected = true
    console.log('[INFO] Authenticated with ' + ip + ':' + port)
  })

  self.socket.on('data', function (data) {
    const length = data.readInt32LE(0)
    const id = data.readInt32LE(4)
    const type = data.readInt32LE(8)
    const response = data.toString('ascii', 12, data.length - 2)

    if (self.packages[id]) {
      self.packages[id](type, response)
    } else {
      console.log('unexpected rcon response', id, type, response)
    }
  }).on('end', function () {
    if (debug) {
      console.log('[DEBUG] Rcon closed!')
    }
  })
}
Rcon.timeout = 5000

Rcon.prototype.close = function () {
  this.connected = false
  this.socket.end()
}

Rcon.prototype.auth = function (pw, cb) {
  const self = this
  self.pass = pw
  self.cb = cb

  if (self.authed) { throw new Error('already authed') }

  if (self.connected) { doAuth() } else { self.socket.on('connect', doAuth) }

  function doAuth () {
    self.sendPackage(3, pw, cb)
  }
}

Rcon.prototype.command = function (cmd, cb) {
  this.sendPackage(2, cmd, cb)
}

Rcon.prototype.sendPackage = function (type, payload, cb) {
  const self = this
  const id = self.nextId
  self.nextId++

  if (!self.connected) { throw new Error('Cannot send package while not connected') }

  const length = 14 + payload.length
  const buff = new Buffer(length)
  buff.writeInt32LE(length - 4, 0)
  buff.writeInt32LE(id, 4)
  buff.writeInt32LE(type, 8)

  buff.write(payload, 12)
  buff.writeInt8(0, length - 2)
  buff.writeInt8(0, length - 1)

  self.socket.write(buff)

  const timeout = setTimeout(function () {
    delete self.packages[id]
    cb('Server sent no request in ' + Rcon.timeout / 1000 + ' seconds')
  }, Rcon.timeout)

  self.packages[id] = function (type, response) {
    clearTimeout(timeout)
    const err = type >= 0 ? false : 'Server sent package code ' + type
    if (debug) {
      console.log('[DEBUG] Recieved response: ' + response)
    }
    cb(err, response, type)
  }
}
