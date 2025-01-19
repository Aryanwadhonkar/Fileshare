import { Bot } from './bot'
import { DatabaseService } from './services/dbServices'

async function main() {
  await DatabaseService.connect()
  const bot = new Bot()
  bot.start()
}

main().catch(console.error)
