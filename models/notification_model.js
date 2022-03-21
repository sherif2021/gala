const mongoose = require('mongoose')


const notificationSchema = new mongoose.Schema({
    categoryId: { type: String, required: true },
    title: { type: String, required: true },
    image: { type: String, required: true },

}, { versionKey: false, timestamps: true, })

module.exports = mongoose.model("notifications", notificationSchema);