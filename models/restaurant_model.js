const mongoose = require('mongoose')


const restaurantsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
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
    description: { type: String, default: '' },
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