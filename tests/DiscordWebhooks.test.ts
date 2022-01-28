import DiscordWebhooks from '../src/DiscordWebhooks'

import { defaultConfig } from './constants'

describe('DiscordWebhooks', () => {
  it('parses discord webhooks', () => {
    const dw = new DiscordWebhooks(defaultConfig)

    expect(dw['parseDiscordWebhook']('https://discordapp.com/api/webhooks/id/token')).toStrictEqual({ id: 'id', token: 'token' })
    expect(dw['parseDiscordWebhook']('https://ptb.discordapp.com/api/webhooks/id/token')).toStrictEqual({ id: 'id', token: 'token' })
    expect(dw['parseDiscordWebhook']('https://discord.com/api/webhooks/id/token')).toStrictEqual({ id: 'id', token: 'token' })
    expect(dw['parseDiscordWebhook']('https://canary.discord.com/api/webhooks/id/token')).toStrictEqual({ id: 'id', token: 'token' })

    expect(dw['parseDiscordWebhook']('https://diskrod.com/api/webhooks/id/token')).toStrictEqual({ id: null, token: null })
  })
  
  it('gets uuid from username and caches', async () => {
    const dw = new DiscordWebhooks(defaultConfig)

    expect(await dw['getUUIDFromUsername']('destruc7i0n')).toBe('2d8cf844fa3441c38d4e597b32697909')
    expect(await dw['getUUIDFromUsername']('hypixel')).toBe('f7c77d999f154a66a87dc4a51ef30d19')

    expect(dw['uuidCache'].get('destruc7i0n')).toBe('2d8cf844fa3441c38d4e597b32697909')
    // this should be cached
    expect(await dw['getUUIDFromUsername']('destruc7i0n')).toBe('2d8cf844fa3441c38d4e597b32697909')
  })

  describe('webhook generation', () => {
    it('creates for valid players', async () => {
      const dw = new DiscordWebhooks(defaultConfig)

      expect(await dw['makeDiscordWebhook']('destruc7i0n', 'hey')).toStrictEqual(
        {
          username: 'destruc7i0n',
          content: 'hey',
          avatarURL: 'https://mc-heads.net/avatar/2d8cf844fa3441c38d4e597b32697909/256',
        }
      )

      expect(await dw['makeDiscordWebhook']('hypixel', 'hey')).toStrictEqual(
        {
          username: 'hypixel',
          content: 'hey',
          avatarURL: 'https://mc-heads.net/avatar/f7c77d999f154a66a87dc4a51ef30d19/256',
        }
      )
    })

    it('creates with default player head for invalid players', async () => {
      const dw = new DiscordWebhooks(defaultConfig)

      // inb4 someone makes `fakedestruc7i0n`
      expect(await dw['makeDiscordWebhook']('fakedestruc7i0n', 'hey')).toStrictEqual(
        {
          username: 'fakedestruc7i0n',
          content: 'hey',
          // default player head
          avatarURL: 'https://mc-heads.net/avatar/c06f89064c8a49119c29ea1dbd1aab82/256',
        }
      )

      const dw2 = new DiscordWebhooks({...defaultConfig, DEFAULT_PLAYER_HEAD: '2d8cf844fa3441c38d4e597b32697909'})

      // inb4 someone makes `fakedestruc7i0n`
      expect(await dw2['makeDiscordWebhook']('fakedestruc7i0n', 'hey')).toStrictEqual(
        {
          username: 'fakedestruc7i0n',
          content: 'hey',
          avatarURL: 'https://mc-heads.net/avatar/2d8cf844fa3441c38d4e597b32697909/256',
        }
      )
    })

    it('creates for server message', async () => {
      const dw = new DiscordWebhooks(defaultConfig)

      expect(await dw['makeDiscordWebhook']('Shulker - Server', 'hey')).toStrictEqual(
        {
          username: 'Shulker - Server',
          content: 'hey',
        }
      )

      const dw2 = new DiscordWebhooks({...defaultConfig, SERVER_IMAGE: 'https://thedestruc7i0n.ca'})

      expect(await dw2['makeDiscordWebhook']('Shulker - Server', 'hey')).toStrictEqual(
        {
          username: 'Shulker - Server',
          content: 'hey',
          avatarURL: 'https://thedestruc7i0n.ca',
        }
      )
    })
  })
})