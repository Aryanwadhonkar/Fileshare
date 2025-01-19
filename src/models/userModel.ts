import mongoose, { Schema, Document } from 'mongoose'
import { User } from '../types'

interface UserDocument extends User, Document { }

const userSchema = new Schema({
    telegramId: { type: Number, required: true, unique: true },
    username: { type: String, required: true },
    isSubscribed: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    sharedMedia: {
        images: { type: Number, default: 0 },
        videos: { type: Number, default: 0 },
        documents: { type: Number, default: 0 },
        audio: { type: Number, default: 0 }
    }
})

export const UserModel = mongoose.model<UserDocument>('User', userSchema)
