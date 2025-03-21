private setupMediaHandlers(): void {
    const handleMedia = async (ctx: any, type: string, fileId: string) => {
        if (!ctx.from) return;

        await DatabaseService.recordMedia(fileId, type, ctx.from.id);
        const subscribers = await DatabaseService.getSubscribers();

        for (const subscriberId of subscribers) {
            if (subscriberId !== ctx.from.id) {
                try {
                    let sentMessage;
                    switch (type) {
                        case 'image':
                            sentMessage = await ctx.telegram.sendPhoto(subscriberId, fileId);
                            break;
                        case 'video':
                            sentMessage = await ctx.telegram.sendVideo(subscriberId, fileId);
                            break;
                        case 'document':
                            sentMessage = await ctx.telegram.sendDocument(subscriberId, fileId);
                            break;
                        case 'audio':
                            sentMessage = await ctx.telegram.sendAudio(subscriberId, fileId);
                            break;
                    }

                    // Set a timer to delete the message after 10 minutes
                    setTimeout(async () => {
                        try {
                            await ctx.telegram.deleteMessage(subscriberId, sentMessage.message_id);
                        } catch (error) {
                            console.error(`Failed to delete media message for user ${subscriberId}:`, error);
                        }
                    }, 600000); // 10 minutes in milliseconds

                } catch (error) {
                    console.error(`Failed to send media to user ${subscriberId}:`, error);
                }
            }
        }

        ctx.reply('Media has been shared with all subscribers!');
    }

    this.bot.on(message('photo'), (ctx) => {
        const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        handleMedia(ctx, 'image', fileId);
    });

    this.bot.on(message('video'), (ctx) => {
        handleMedia(ctx, 'video', ctx.message.video.file_id);
    });

    this.bot.on(message('document'), (ctx) => {
        handleMedia(ctx, 'document', ctx.message.document.file_id);
    });

    this.bot.on(message('audio'), (ctx) => {
        handleMedia(ctx, 'audio', ctx.message.audio.file_id);
    });
}
