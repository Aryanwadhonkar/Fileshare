import dotenv from 'dotenv'
dotenv.config()

export const config = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  MONGODB_URI: process.env.MONGODB_URI || '',
  ADMIN_IDS: (process.env.ADMIN_IDS || '').split(',').map(id => Number(id))
}
