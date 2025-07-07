import mongoose, { Schema } from "mongoose"
const uniqueValidator = require("mongoose-unique-validator")

const UserSchema = new Schema({
    _id: {
        type: String
    },
    images: [{
        type: Schema.Types.ObjectId,
        ref: "Image",
        default: []
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
})

UserSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

UserSchema.plugin(uniqueValidator);

export default mongoose.model('User', UserSchema)