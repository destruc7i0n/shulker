import { Wrap, download } from 'minecraft-wrap'
import path from 'path'
import mineflayer from 'mineflayer'

import Rcon from '../src/Rcon'
import MinecraftHandler, { LogLine } from '../src/MinecraftHandler'
import { defaultConfig } from './constants'

const MC_VERSION = process.env['MC_VERSION']
const MC_SERVER_PATH = path.resolve(`./tests/server/server-${MC_VERSION}`)
const MC_SERVER_JAR = path.join(MC_SERVER_PATH, `${MC_VERSION}.jar`)

const RCON_PORT = 25575
const RCON_PASSWORD = 'test'
const configWithServer = {
  ...defaultConfig,
  DEBUG: true,
  IS_LOCAL_FILE: true,
  LOCAL_FILE_PATH: path.join(MC_SERVER_PATH, 'logs/latest.log'),
  MINECRAFT_SERVER_RCON_IP: '127.0.0.1',
  MINECRAFT_SERVER_RCON_PORT: RCON_PORT,
  MINECRAFT_SERVER_RCON_PASSWORD: RCON_PASSWORD
}

const wrap = new Wrap(MC_SERVER_JAR, MC_SERVER_PATH)

const serverProperties = {
  'online-mode': 'false',
  'level-type': 'FLAT',
  'enable-rcon': 'true',
  'rcon.password': RCON_PASSWORD,
  'rcon.port': RCON_PORT.toString(),
}

describe(`MinecraftServer v${MC_VERSION}`, () => {
  jest.setTimeout(1000 * 60) // 1 minutes
  const serverLog = jest.fn((_line: string) => undefined)
  let rcon: Rcon
  // const logSpy = jest.spyOn(console, 'log')

  beforeAll((done) => {
    console.log(`Downloading Minecraft ${MC_VERSION} server...`)
    
    download(MC_VERSION, MC_SERVER_JAR, (err: any) => {
      if (err) {
        console.error(err)
        done(err)
        return
      }
      console.log(`Minecraft ${MC_VERSION} server JAR downloaded`)
      done()
    })
  })

  beforeEach((done) => {
    // Clear previous logs
    serverLog.mockClear()
    
    wrap.on('line', (line: string) => {
      console.log(`[${MC_VERSION} SERVER] ${line}`)
      serverLog(line)
    })

    console.log(`Starting fresh Minecraft ${MC_VERSION} server instance...`)
    wrap.startServer(serverProperties, (err: any) => {
      if (err) {
        console.error(err)
        done(err)
        return
      }

      rcon = new Rcon(configWithServer.MINECRAFT_SERVER_RCON_IP, configWithServer.MINECRAFT_SERVER_RCON_PORT, configWithServer.DEBUG)
      rcon.auth(configWithServer.MINECRAFT_SERVER_RCON_PASSWORD).then(() => {
        console.log(`[${MC_VERSION} RCON] Connected and authenticated`)
        done()
      })
    })
  })

  afterEach((done) => {
    console.log(`Stopping Minecraft ${MC_VERSION} server...`)
    wrap.stopServer((err: any) => {
      if (err) {
        console.error(err)
      }
      done()
    })
  })

  afterAll((done) => {
    console.log(`Cleaning up server files...`)
    wrap.deleteServerData((err: any) => {
      if (err) {
        console.log(err)
      }
      done(err)
    })
  })

  // with 1.19.2 the name is surrounded with brackets rather than <>

  it('reads logs from Minecraft server', (done) => {
    const handler = new MinecraftHandler(configWithServer)
    // (handler as any) since private
    const parseLogLineSpy = jest.spyOn(handler as any, 'parseLogLine')

    handler.init((data: LogLine) => {
      console.log(`[${MC_VERSION} SHULKER]:`, data)

      // both the server and the handler should have received the line
      expect(data).toBeNull()
      expect(parseLogLineSpy).toHaveBeenCalledWith(expect.stringContaining('[Server] hello world!'))
      expect(serverLog).toHaveBeenCalledWith(expect.stringContaining('[Server] hello world!'))

      handler._teardown()
      done()
    })

    setTimeout(() => {
      wrap.writeServer('say hello world!\n')
    }, 1000 * 5)
  })

  it('connects to Minecraft server via rcon', async () => {
    await rcon.command('say hello world from rcon!')

    await new Promise(resolve => setTimeout(resolve, 1000 * 2))

    expect(serverLog).toHaveBeenCalledWith(expect.stringContaining('[Rcon] hello world from rcon!'))

    rcon.close()
  })

  describe('mineflayer', () => {
    let bot: mineflayer.Bot
    beforeEach((done) => {
      bot = mineflayer.createBot({
        host: 'localhost',
        port: 25565,
        username: 'TestBot',
        version: MC_VERSION,
        skipValidation: true
      })

      bot.once('spawn', () => {
        done()
      })

      bot.on('end', () => {
        console.log(`[${MC_VERSION} SHULKER] Bot disconnected`)
      })
    })

    it('handles bot chat message', (done) => {
      const handler = new MinecraftHandler(configWithServer)

      handler.init((data: LogLine) => {
        console.log(`[${MC_VERSION} SHULKER] Got message:`, data)

        if (data && data.username === 'TestBot' && data.message === 'Hello from mineflayer!') {        
          expect(data.username).toBe('TestBot')
          expect(data.message).toBe('Hello from mineflayer!')
          
          handler._teardown()
          done()
        }
      })

      bot.chat('Hello from mineflayer!')
      setTimeout(() => bot.quit(), 1000)
    })

    it('handles bot join/leave connection status', (done) => {
      const handler = new MinecraftHandler(configWithServer)
      let joinMessageReceived = false
      let leaveMessageReceived = false

      handler.init((data: LogLine) => {
        console.log(`[${MC_VERSION} SHULKER] Connection status test log:`, data)

        if (data && data.username.includes('Server') && data.message.includes('TestBot joined the game')) {
          joinMessageReceived = true
          expect(data.message).toContain('TestBot joined the game')
        }

        if (data && data.username.includes('Server') && data.message.includes('TestBot left the game')) {
          leaveMessageReceived = true
          expect(data.message).toContain('TestBot left the game')
          
          // Both messages received, test complete
          if (joinMessageReceived && leaveMessageReceived) {
            handler._teardown()
            done()
          }
        }
      })

      // Bot should automatically generate join message when it connects
      // Then we'll make it quit to generate leave message
      setTimeout(() => {
        bot.quit()
      }, 2000)
    })

    it('handles /me command messages', (done) => {
      const handler = new MinecraftHandler(configWithServer)

      handler.init((data: LogLine) => {
        console.log(`[${MC_VERSION} SHULKER] /me command test log:`, data)

        if (data && data.username.includes('Server') && data.message.includes('**TestBot**')) {
          expect(data.message).toContain('**TestBot** is testing /me command')
          
          handler._teardown()
          bot.quit()
          done()
        }
      })

      setTimeout(() => {
        // Send /me command
        bot.chat('/me is testing /me command')
      }, 1000)
    })
  })
})