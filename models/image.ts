import { Schema } from "mongoose"
const uniqueValidator = require("mongoose-unique-validator")

const ImageSchema = new Schema({
    prompt: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    width: {
        type: Number,
        required: true
    },
    height: {
        type: Number,
        required: true
    },
    seed: {
        type: Number,
        required: true
    },
    likedBy: [{
        type: String,
        ref: "User",
        default: []
    }],
    dislikes: [{
        type: String,
        ref: "User",
        default: []
    }],
    createdBy: {
        type: String,
        ref: "User"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

ImageSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

ImageSchema.plugin(uniqueValidator);

export default mongoose.model('Image', ImageSchema)