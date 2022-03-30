const mongoose = require('mongoose')


const restaurantsSchema = new mongoose.Schema({
    nameAr: { type: String, required: true },
    nameEn: { type: String, required: true },
    addressAr: { type: String, required: true },
    addressEn: { type: String, required: true },
    descriptionAr: { type: String, default: '' },
    descriptionEn: { type: String, default: '' },

    taxesNumber: { type: String, required: true },
    minimumDeliveryTime: { type: Number, required: true },
    maximumDeliveryTime: { type: Number, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    logo: { type: String, required: true },
    cover: { type: String, required: true },
    ownerName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    mail: { type: String, required: true },
    password: { type: String, required: true },
    active: { type: Boolean, default: true },

    isBusy: { type: Boolean, default: false },
    isOpen: { type: Boolean, default: true },
    openDate: { type: Number, default: 7 },
    closeDate: { type: Number, default: 22 },
    lowestOrderPrice: { type: Number, default: 0 },
    deliveryPrice: { type: Number, default: 0 },
    cats: {
        type: Array,
    },

    rate: {
        type: mongoose.Schema.Types.Number,
        default: 5.0
    },

    paid: {
        type: Number,
        default: 0
    },
    commission: {
        type: Number,
        default: 2,
    },

}, { versionKey: false, timestamps: true, })

module.exports = mongoose.model("restaurants", restaurantsSchema);