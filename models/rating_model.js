const mongoose = require('mongoose')


const ratingSechema = new mongoose.Schema({

    userId: { type: String, required: true },
    restId: { type: String, required: true },
    deliveryId: { type: String, required: true },
    comment: { type: String, default: '' },
    deliveryQuality: { type: Number, required: true },
    foodQuality: { type: Number, required: true },
    qualityForThePrice: { type: Number, required: true },
    orderPacking: { type: Number, required: true },

}, { versionKey: false, timestamps: true, })

module.exports = mongoose.model("rating", ratingSechema);