const mongoose = require('mongoose')


const categorySchema = new mongoose.Schema({
    nameEn: { type: String, required: true },
    nameAr: { type: String, required: true },
    image: { type: String, required: true },
    added_by: { type: String, required: true },
    accepted: { type: Boolean, default: false },

}, { versionKey: false, timestamps: true, })

module.exports = mongoose.model("categories", categorySchema);