export interface User {
    telegramId: number
    username: string
    isSubscribed: boolean
    isAdmin: boolean
    isBanned: boolean
    sharedMedia: {
        images: number
        videos: number
        documents: number
        audio: number
    }
}

export interface Media {
    fileId: string
    type: 'image' | 'video' | 'document' | 'audio'
    sharedBy: number // telegram user id
    sharedAt: Date
}
