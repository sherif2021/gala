const mongoose = require('mongoose')


const orderSchema = new mongoose.Schema({

    accepted: { type: Boolean, default: false },
    cooked: { type: Boolean, default: false },
    picking: { type: Boolean, default: false },
    inTheWay: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    paid: { type: Boolean, default: false },
    declined: { type: Boolean, default: false },
    declinedReasons: { type: String, default: '' },


    restId: { type: String, required: true },

    meals: { type: Array, required: true },

    orderTime: { type: Number, required: true },

    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    userAddress: { type: String, required: false },
    userLatitude: { type: Number, required: false },
    userLongitude: { type: Number, required: false },


    deliveryId: { type: String, default: '' },
    orderNumber: { type: Number, default: 0 },
    delivery: { type: Boolean, default: false },

    deliveryCost: { type: Number, default: 0 },

    commission: {
        type: Number,
        default: 0
    },
    deliveryCommission: {
        type: Number,
        default: 0
    },
    coupon: {
        type: Object,
    }

}, { versionKey: false, timestamps: true, })

const model = mongoose.model("orders", orderSchema)

module.exports = model;