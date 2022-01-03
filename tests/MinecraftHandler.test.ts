import MinecraftHandler from '../src/MinecraftHandler'

import { defaultConfig } from './constants'

describe('MinecraftHandler', () => {
  test('parses player join connection stat', () => {
    const handler = new MinecraftHandler(defaultConfig)

    const { message } = handler['parseLogLine']('[Server thread/INFO]: destruc7i0n joined the game')!
    
    expect(message).toBe('destruc7i0n joined the game')
  })

  test('parses player leave connection stat', () => {
    const handler = new MinecraftHandler(defaultConfig)

    const { message } = handler['parseLogLine']('[Server thread/INFO]: destruc7i0n left the game')!
    
    expect(message).toBe('destruc7i0n left the game')
  })

  test('parses death messages', () => {
    const handler = new MinecraftHandler(defaultConfig)

    const tests = [
      '[Server thread/INFO]: destruc7i0n drowned',
      '[Server thread/INFO]: destruc7i0n died',
      '[Server thread/INFO]: destruc7i0n experienced kinetic energy',
      '[Server thread/INFO]: destruc7i0n blew up',
      '[Server thread/INFO]: destruc7i0n hit the ground too hard',
      '[Server thread/INFO]: destruc7i0n fell off a ladder',
      '[Server thread/INFO]: destruc7i0n was squashed by a falling anvil',
      '[Server thread/INFO]: destruc7i0n went off with a bang',
      '[Server thread/INFO]: destruc7i0n tried to swim in lava',
      '[Server thread/INFO]: destruc7i0n was slain by mcfunction',
      '[Server thread/INFO]: destruc7i0n suffocated in a wall',
      '[Server thread/INFO]: destruc7i0n fell out of the world',
      '[Server thread/INFO]: destruc7i0n withered away',
    ]

    for (const test of tests) {
      const { message } = handler['parseLogLine'](test)!

      expect(message).toBe(test.replace('[Server thread/INFO]: ', ''))
    }
  })
})