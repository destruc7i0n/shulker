import { Wrap, download } from 'minecraft-wrap'
import path from 'path'

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
  // const logSpy = jest.spyOn(console, 'log')

  beforeAll((done) => {
    console.log(`Downloading Minecraft ${MC_VERSION} server...`)

    wrap.on('line', (line: string) => {
      console.log(`[${MC_VERSION} SERVER] ${line}`)
      serverLog(line)
    })

    download(MC_VERSION, MC_SERVER_JAR, (err: any) => {
      if (err) {
        console.error(err)
        done(err)
        return
      }

      console.log(`Starting Minecraft ${MC_VERSION} server...`)
      wrap.startServer(serverProperties, (err: any) => {
        if (err) {
          console.error(err)
          done(err)
          return
        }
        done()
      })
    })
  })

  afterAll((done) => {
    wrap.stopServer((err: any) => {
      if (err) {
        console.error(err)
      }
      // done()
      wrap.deleteServerData((err: any) => {
        if (err) {
          console.log(err)
        }
        done(err)
      })
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
      // simulate a chat message after a few seconds
      wrap.writeServer('say hello world!\n')
    }, 1000 * 10)
  })

  it('connects to Minecraft server via rcon', async () => {
    const rcon = new Rcon(configWithServer.MINECRAFT_SERVER_RCON_IP, configWithServer.MINECRAFT_SERVER_RCON_PORT, configWithServer.DEBUG)
    await rcon.auth(configWithServer.MINECRAFT_SERVER_RCON_PASSWORD)

    await rcon.command('say hello world from rcon!')

    await new Promise((resolve) => setTimeout(resolve, 1000 * 2))

    expect(serverLog).toHaveBeenCalledWith(expect.stringContaining('[Rcon] hello world from rcon!'))

    rcon.close()
  })
})