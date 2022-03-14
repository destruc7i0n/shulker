import Discord from '../src/Discord'

import { defaultConfig } from './constants'

describe('Discord', () => {
  describe('replace mentions', () => {
    it('does not replace mentions if config is disabled', async () => {
      const discord = new Discord(defaultConfig)

      const replacedMessage = await discord['replaceDiscordMentions']('hey @destruc7i0n#7070')
      expect(replacedMessage).toBe('hey @destruc7i0n#7070')
    })

    // test('does replace mentions if config is enabled', async () => {
    //   const discord = new Discord({...defaultConfig, ALLOW_USER_MENTIONS: true})
    //   await discord.init()

    //   const replacedMessage = await discord['replaceDiscordMentions']('hey @destruc7i0n#7070')
    //   expect(replacedMessage).toBe('hey <@129277271843274752>')
    // })

    it('removes @everyone and @here if disabled', async () => {
      const discord = new Discord({...defaultConfig, ALLOW_HERE_EVERYONE_MENTIONS: false})

      const everyone = await discord['replaceDiscordMentions']('hey @everyone')
      const here = await discord['replaceDiscordMentions']('hey @here')
      
      expect(everyone).toBe('hey @ everyone')
      expect(here).toBe('hey @ here')
    })

    it('keeps @everyone and @here if enabled', async () => {
      const discord = new Discord({...defaultConfig, ALLOW_HERE_EVERYONE_MENTIONS: true})

      const everyone = await discord['replaceDiscordMentions']('hey @everyone')
      const here = await discord['replaceDiscordMentions']('hey @here')
      
      expect(everyone).toBe('hey @everyone')
      expect(here).toBe('hey @here')
    })
  })

  describe('minecraft messages', () => {
    it('correctly generates a tellraw string in messages', async () => {
      const discord = new Discord(defaultConfig)

      const message = discord['buildMinecraftCommand']({ author: { username: 'destruc7i0n', discriminator: '7070' }, member: { nickname: 't70' }, cleanContent: 'test' } as any)
      expect(message).toBe('tellraw @a [{"color": "white", "text": "<@destruc7i0n> test"}]')
    })

    it('correctly generates a tellraw string with unicode characters in message', async () => {
      const discord = new Discord(defaultConfig)

      const message = discord['buildMinecraftCommand']({ author: { username: 'destruc7i0n', discriminator: '7070' }, member: { nickname: 't70' }, cleanContent: 'æ, ø, å (Æ, Ø, Å) 건희' } as any)
      expect(message).toBe('tellraw @a [{"color": "white", "text": "<@destruc7i0n> \\u00e6, \\u00f8, \\u00e5 (\\u00c6, \\u00d8, \\u00c5) \\uac74\\ud76c"}]')
    })

    it('correctly generates a tellraw string with unicode characters in username ', async () => {
      const discord = new Discord(defaultConfig)

      const message = discord['buildMinecraftCommand']({ author: { username: '건희destruc7i0n건희', discriminator: '7070' }, member: { nickname: 't70' }, cleanContent: 'huh' } as any)
      expect(message).toBe('tellraw @a [{"color": "white", "text": "<@\\uac74\\ud76cdestruc7i0n\\uac74\\ud76c> huh"}]')
    })

    it('correctly replaces all parts of a message string', () => {
      const discord = new Discord({ ...defaultConfig, MINECRAFT_TELLRAW_TEMPLATE: '[{\"color\": \"white\", \"text\": \"<@%username%#%discriminator% (%nickname%)> %message%\"}]' })
      
      const message = discord['buildMinecraftCommand']({ author: { username: 'destruc7i0n', discriminator: '7070' }, member: { nickname: 't70' }, cleanContent: 'test' } as any)
      expect(message).toBe('tellraw @a [{\"color\": \"white\", \"text\": \"<@destruc7i0n#7070 (t70)> test\"}]')
    })

    it('correctly replaces all parts of a message string with unicode everywhere', () => {
      const discord = new Discord({ ...defaultConfig, MINECRAFT_TELLRAW_TEMPLATE: '[{\"color\": \"white\", \"text\": \"<@%username%#%discriminator% (%nickname%)> %message%\"}]' })
      
      const message = discord['buildMinecraftCommand']({ author: { username: '건희destruc7i0n건희', discriminator: '7070' }, member: { nickname: '건희t70건희' }, cleanContent: 'æ, ø, å (Æ, Ø, Å) 건희' } as any)
      expect(message).toBe('tellraw @a [{\"color\": \"white\", \"text\": \"<@\\uac74\\ud76cdestruc7i0n\\uac74\\ud76c#7070 (\\uac74\\ud76ct70\\uac74\\ud76c)> \\u00e6, \\u00f8, \\u00e5 (\\u00c6, \\u00d8, \\u00c5) \\uac74\\ud76c\"}]')
    })

    it('does not return command when sending slash command and user does not have role', async () => {
      const discord = new Discord({ ...defaultConfig, ALLOW_SLASH_COMMANDS: true, SLASH_COMMAND_ROLES_IDS: ['123'] })

      const message = discord['buildMinecraftCommand']({ author: { username: 'destruc7i0n', discriminator: '7070' }, member: { nickname: 't70', roles: { cache: new Map([]) } }, cleanContent: '/say destruc7i0n' } as any)
      expect(message).toBeUndefined()
    })
    
    it('returns command when sending slash command and user has role', async () => {
      const discord = new Discord({ ...defaultConfig, ALLOW_SLASH_COMMANDS: true, SLASH_COMMAND_ROLES_IDS: ['123'] })

      const message = discord['buildMinecraftCommand']({ author: { username: 'destruc7i0n', discriminator: '7070' }, member: { nickname: 't70', roles: { cache: new Map([['123', true]]) } }, cleanContent: '/say destruc7i0n' } as any)
      expect(message).toBe('/say destruc7i0n')
    })
  })
})