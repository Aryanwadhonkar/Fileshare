import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import { config } from '../config'
import { DatabaseService } from '../services/dbServices'

export class Bot {
    private bot: Telegraf

    constructor() {
        this.bot = new Telegraf(config.TELEGRAM_BOT_TOKEN)
        this.setupCommands()
        this.setupMediaHandlers()
        this.setupMenu()
    }

    private async setupMenu(): Promise<void> {
        try {
            await this.bot.telegram.setMyCommands([
                { command: 'start', description: 'Start the bot' },
                { command: 'subscribe', description: 'Toggle subscription for media updates' },
                { command: 'help', description: 'Show help information' }
            ]);
            console.log('Menu has been set up!')
        } catch (error) {
            console.error('Failed to setup menu:', error)
        }
    }

    private setupCommands(): void {
        this.bot.command('start', async (ctx) => {
            const { id, username } = ctx.from
            try {
                await DatabaseService.createUser(id, username || 'anonymous')
                ctx.reply('Welcome! Use /subscribe to start receiving shared media.')
            } catch (error) {
                ctx.reply('Welcome back! Use /subscribe to start receiving shared media.')
            }
        })

        this.bot.command('subscribe', async (ctx) => {
            const isSubscribed = await DatabaseService.toggleSubscription(ctx.from.id)
            ctx.reply(isSubscribed ?
                'You are now subscribed to media updates!' :
                'You have unsubscribed from media updates.'
            )
        })

        this.bot.command('stats', async (ctx) => {
            if (!config.ADMIN_IDS.includes(ctx.from.id)) {
                return ctx.reply('This command is only available to admins.')
            }

            const stats = await DatabaseService.getStats()
            ctx.reply(
                `📊 Bot Statistics:\n\n` +
                `Subscribers: ${stats.subscribers}\n` +
                `Total Media Shared: ${stats.totalMedia}\n\n` +
                `Media by Type:\n` +
                Object.entries(stats.mediaByType)
                    .map(([type, count]) => `${type}: ${count}`)
                    .join('\n')
            )
        })

        this.bot.command('ban', async (ctx) => {
            if (!config.ADMIN_IDS.includes(ctx.from.id)) {
                return ctx.reply('This command is only available to admins.')
            }

            const userId = ctx.message.text.split(' ')[1]
            if (!userId) {
                return ctx.reply('Please provide a user ID to ban.')
            }

            const banned = await DatabaseService.banUser(Number(userId))
            ctx.reply(banned ?
                `User ${userId} has been banned.` :
                `User ${userId} not found.`
            )
        })

        this.bot.command('unban', async (ctx) => {
            if (!config.ADMIN_IDS.includes(ctx.from.id)) {
                return ctx.reply('This command is only available to admins.')
            }

            const userId = ctx.message.text.split(' ')[1]
            if (!userId) {
                return ctx.reply('Please provide a user ID to remove the ban.')
            }

            const banned = await DatabaseService.unbanUser(Number(userId))
            ctx.reply(banned ?
                `User ${userId} has been unbanned.` :
                `User ${userId} not found.`
            )
        })

        this.bot.command('help', async (ctx) => {
            ctx.reply('Use /subscribe to start receiving shared media.')
        })
    }

    private setupMediaHandlers(): void {
        const handleMedia = async (ctx: any, type: string, fileId: string) => {
            if (!ctx.from) return

            await DatabaseService.recordMedia(fileId, type, ctx.from.id)
            const subscribers = await DatabaseService.getSubscribers()

            for (const subscriberId of subscribers) {
                if (subscriberId !== ctx.from.id) {
                    try {
                        switch (type) {
                            case 'image':
                                await ctx.telegram.sendPhoto(subscriberId, fileId)
                                break
                            case 'video':
                                await ctx.telegram.sendVideo(subscriberId, fileId)
                                break
                            case 'document':
                                await ctx.telegram.sendDocument(subscriberId, fileId)
                                break
                            case 'audio':
                                await ctx.telegram.sendAudio(subscriberId, fileId)
                                break
                        }
                    } catch (error) {
                        console.error(`Failed to send media to user ${subscriberId}:`, error)
                    }
                }
            }

            ctx.reply('Media has been shared with all subscribers!')
        }

        this.bot.on(message('photo'), (ctx) => {
            const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id
            handleMedia(ctx, 'image', fileId)
        })

        this.bot.on(message('video'), (ctx) => {
            handleMedia(ctx, 'video', ctx.message.video.file_id)
        })

        this.bot.on(message('document'), (ctx) => {
            handleMedia(ctx, 'document', ctx.message.document.file_id)
        })

        this.bot.on(message('audio'), (ctx) => {
            handleMedia(ctx, 'audio', ctx.message.audio.file_id)
        })
    }

    public start(): void {
        this.bot.launch()
        console.log('Bot is running...')

        process.once('SIGINT', () => this.bot.stop('SIGINT'))
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'))
    }
}
