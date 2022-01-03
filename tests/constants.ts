import type { Config } from '../src/Config'

export const defaultConfig: Config = {
  ...require('../config.example.json'),
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  WEBHOOK_URL: process.env.WEBHOOK_URL,
  DISCORD_CHANNEL_ID: process.env.DISCORD_CHANNEL_ID,
}
