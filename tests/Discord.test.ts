import Discord from '../src/Discord'

import { defaultConfig } from './constants'

describe('Discord', () => {
  describe('replace mentions', () => {
    test('does not replace mentions if config is disabled', async () => {
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

    test('removes @everyone and @here if disabled', async () => {
      const discord = new Discord({...defaultConfig, ALLOW_HERE_EVERYONE_MENTIONS: false})

      const everyone = await discord['replaceDiscordMentions']('hey @everyone')
      const here = await discord['replaceDiscordMentions']('hey @here')
      
      expect(everyone).toBe('hey @ everyone')
      expect(here).toBe('hey @ here')
    })

    test('keeps @everyone and @here if enabled', async () => {
      const discord = new Discord({...defaultConfig, ALLOW_HERE_EVERYONE_MENTIONS: true})

      const everyone = await discord['replaceDiscordMentions']('hey @everyone')
      const here = await discord['replaceDiscordMentions']('hey @here')
      
      expect(everyone).toBe('hey @everyone')
      expect(here).toBe('hey @here')
    })
  })
})