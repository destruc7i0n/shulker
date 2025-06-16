import path from 'path'
import mineflayer from 'mineflayer'

import Rcon from '../src/Rcon'
import MinecraftHandler, { LogLine } from '../src/MinecraftHandler'
import { defaultConfig } from './constants'
import { compareVersions } from './lib'

const { Wrap, download } = require('minecraft-wrap')

const MC_VERSION = process.env['MC_VERSION']!
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

const serverProperties = {
  'online-mode': 'false',
  'level-type': 'FLAT',
  'enable-rcon': 'true',
  'rcon.password': RCON_PASSWORD,
  'rcon.port': RCON_PORT.toString(),
}

describe(`MinecraftServer v${MC_VERSION}`, () => {
  jest.setTimeout(1000 * 60 * 2) // 2 minutes
  
  const serverLog = jest.fn((_line: string) => undefined)
  let wrap: any
  let rcon: Rcon

  beforeAll(async () => {
    console.log(`Downloading Minecraft ${MC_VERSION} server...`)
    await new Promise<void>((resolve, reject) => {
      download(MC_VERSION, MC_SERVER_JAR, (err: any) => {
        if (err) {
          console.error(err)
          return reject(err)
        }

        console.log(`Minecraft ${MC_VERSION} server JAR downloaded`)
        resolve()
      })
    })
  })

  beforeEach(async () => {
    console.info(`[${MC_VERSION} SERVER] Starting Minecraft ${MC_VERSION} server for test: ${expect.getState().currentTestName}`)

    // Clear previous logs
    serverLog.mockClear()

    wrap = new Wrap(MC_SERVER_JAR, MC_SERVER_PATH, {
      doneRegex: /\[.+\]: RCON running on/
    })
    
    wrap.on('line', (line: string) => {
      console.log(`[${MC_VERSION} SERVER] ${line}`)
      serverLog(line)
    })

    await new Promise<void>((resolve, reject) => {
      wrap.startServer(serverProperties, (err: any) => {
        if (err) {
          console.error(err)
          return reject(err)
        }
        resolve()
      })
    })

    try {
      rcon = new Rcon(configWithServer.MINECRAFT_SERVER_RCON_IP, configWithServer.MINECRAFT_SERVER_RCON_PORT, configWithServer.DEBUG)
      await rcon.auth(configWithServer.MINECRAFT_SERVER_RCON_PASSWORD)
      console.log(`[${MC_VERSION} RCON] Connected and authenticated`)
    } catch (err) {
      console.error('Failed to authenticate with RCON')
      throw err
    }
  })

  afterEach(async () => {
    console.log(`Stopping Minecraft ${MC_VERSION} server...`)
    rcon?.close()
    await new Promise<void>((resolve) => {
      wrap.stopServer((err: any) => {
        if (err) {
          console.error(err)
        }
        resolve()
      })
    })
  })

  afterAll(async () => {
    console.log(`Cleaning up server files...`)
    await new Promise<void>((resolve, reject) => {
      wrap.deleteServerData((err: any) => {
        if (err) {
          console.log(err)
          return reject(err)
        }
        resolve()
      })
    })
  })

  it('reads logs from Minecraft server', async () => {
    const handler = new MinecraftHandler(configWithServer)
    const parseLogLineSpy = jest.spyOn(handler as any, 'parseLogLine')
  
    const logPromise = new Promise<void>(resolve => {
      handler.init((data: LogLine) => {
        console.log(`[${MC_VERSION} SHULKER]:`, data)
  
        // We resolve the promise only when the expected log line is seen.
        const helloWorldLog = serverLog.mock.calls.find(call => call[0].includes('[Server] hello world!'))
        if (helloWorldLog) {
          // The handler returns null for this type of message
          expect(data).toBeNull()
          expect(parseLogLineSpy).toHaveBeenCalledWith(expect.stringContaining('[Server] hello world!'))
          expect(serverLog).toHaveBeenCalledWith(expect.stringContaining('[Server] hello world!'))
  
          handler._teardown()
          resolve()
        }
      })
    })
  
    // Give the server a moment to start before sending commands
    await new Promise(resolve => setTimeout(resolve, 1000 * 5))
    wrap.writeServer('say hello world!\n')
  
    await logPromise
  })

  it('connects to Minecraft server via rcon', async () => {
    await rcon.command('say hello world from rcon!')

    await new Promise(resolve => setTimeout(resolve, 1000 * 2))

    expect(serverLog).toHaveBeenCalledWith(expect.stringContaining('[Rcon] hello world from rcon!'))

    rcon.close()
  })

  describe('mineflayer', () => {
    const initBot = (): Promise<mineflayer.Bot> => {
      return new Promise((resolve, reject) => {
        const bot = mineflayer.createBot({
          host: 'localhost',
          port: 25565,
          username: 'TestBot',
          version: MC_VERSION,
          skipValidation: true
        })

        bot.once('spawn', () => {
          resolve(bot)
        })

        bot.on('error', (err: any) => {
          console.error(`[${MC_VERSION} SHULKER] Bot error:`, err)
          reject(err)
        })
  
        bot.on('end', () => {
          console.log(`[${MC_VERSION} SHULKER] Bot disconnected`)
        })
      })
    }

    it('handles bot chat message', async () => {
      const handler = new MinecraftHandler(configWithServer)

      const chatPromise = new Promise<void>(resolve => {
        handler.init((data: LogLine) => {
          console.log(`[${MC_VERSION} SHULKER] Bot chat message test log:`, data)
  
          if (data && data.username === 'TestBot' && data.message === 'Hello from mineflayer!' && data.type === 'chat') {        
            expect(data.username).toBe('TestBot')
            expect(data.message).toBe('Hello from mineflayer!')
            
            handler._teardown()
            resolve()
          }
        })
      })

      const bot = await initBot()
      bot.chat('Hello from mineflayer!')

      await chatPromise
    })

    it('handles bot join/leave connection status', async () => {
      const handler = new MinecraftHandler({
        ...configWithServer,
        SHOW_PLAYER_CONN_STAT: true
      })
      let joinMessageReceived = false
      let leaveMessageReceived = false

      const connectionPromise = new Promise<void>(resolve => {
        handler.init((data: LogLine) => {
          console.log(`[${MC_VERSION} SHULKER] Connection status test log:`, data)
  
          if (data && data.username.includes('Server') && data.message.includes('joined') && data.type === 'connection') {
            joinMessageReceived = true
            expect(data.message).toContain('TestBot joined the game')
          }
  
          if (data && data.username.includes('Server') && data.message.includes('left') && data.type === 'connection') {
            leaveMessageReceived = true
            expect(data.message).toContain('TestBot left the game')
          }

          if (joinMessageReceived && leaveMessageReceived) {
            handler._teardown()
            resolve()
          }
        })
      })

      const bot = await initBot()
      // Bot should automatically generate join message when it connects
      // Then we'll make it quit to generate leave message
      setTimeout(() => {
        bot.quit()
      }, 2000)

      await connectionPromise
    })

    it('handles /me command messages', async () => {
      const handler = new MinecraftHandler({
        ...configWithServer,
        SHOW_PLAYER_ME: true
      })

      const mePromise = new Promise<void>(resolve => {
        handler.init((data: LogLine) => {
          console.log(`[${MC_VERSION} SHULKER] /me command test log:`, data)
  
          if (data && data.username.includes('Server') && data.message.includes('TestBot') && data.type === 'me') {
            expect(data.message).toContain('**TestBot** is testing /me command')
            
            handler._teardown()
            resolve()
          }
        })
      })

      const bot = await initBot()
      setTimeout(() => {
        bot.chat('/me is testing /me command')
      }, 1000)
      
      await mePromise
    })

    it('handles player death messages', async () => {
      let deathMessageRegexString: string | undefined = undefined
      
      // if greater than or equal to 1.21.4, use the new death message regex
      if (compareVersions(MC_VERSION, '1.21.4') >= 0) {
        deathMessageRegexString = 'Killed [\\w_]+'
      } else {
        deathMessageRegexString = configWithServer.REGEX_DEATH_MESSAGE
      }

      console.log(`[${MC_VERSION} SHULKER] Death message regex: ${deathMessageRegexString}`)

      const handler = new MinecraftHandler({
        ...configWithServer,
        SHOW_PLAYER_DEATH: true,
        REGEX_DEATH_MESSAGE: deathMessageRegexString
      })

      const bot = await initBot()
      const deathPromise = new Promise<void>(resolve => {
        handler.init((data: LogLine) => {
          console.log(`[${MC_VERSION} SHULKER] Death message test log:`, data)

          if (data?.type === 'death' && data.message.includes('TestBot')) {
            handler._teardown()
            bot.quit()
            resolve()
          }
        })
      })

      // Give the bot a moment to spawn before killing it.
      setTimeout(() => {
        wrap.writeServer('kill TestBot\n')
      }, 2000)

      await deathPromise
    })

    it('handles player advancement messages', async () => {
      const handler = new MinecraftHandler({
        ...configWithServer,
        SHOW_PLAYER_ADVANCEMENT: true
      })

      const advancementPromise = new Promise<void>(resolve => {
        handler.init((data: LogLine) => {
          console.log(`[${MC_VERSION} SHULKER] Advancement test log:`, data)
  
          if (data && data.username.includes('Server') && data.message.includes('TestBot') && data.type === 'advancement') {
            expect(data.message).toContain('TestBot has made the advancement')
            
            handler._teardown()
            resolve()
          }
        })
      })

      await initBot()
      setTimeout(() => {
        // Give the bot an advancement using RCON
        wrap.writeServer('advancement grant TestBot only minecraft:story/mine_stone\n')
      }, 1000)

      await advancementPromise
    })
  })
})
