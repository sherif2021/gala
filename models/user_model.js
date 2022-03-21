const mongoose = require('mongoose')


const userSchema = new mongoose.Schema({
    uid: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    provider: { type: String, required: true },
    gender: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
    notification: { type: Boolean, default: true },
    image: { type: String, default: '' },
    addresses: { type: Array, default: [] },
    fcmToken: { type: String },
}, { versionKey: false, timestamps: true, })
module.exports = mongoose.model("users", userSchema);