import mongoose, { Schema, Document } from 'mongoose'
import { Media } from '../types'

interface MediaDocument extends Media, Document { }

const mediaSchema = new Schema({
    fileId: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: ['image', 'video', 'document', 'audio'] },
    sharedBy: { type: Number, required: true },
    sharedAt: { type: Date, default: Date.now }
})

export const MediaModel = mongoose.model<MediaDocument>('Media', mediaSchema)
