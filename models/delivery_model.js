const mongoose = require('mongoose')


const deliverersSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    identityNumber: { type: String, required: true },
    mail: { type: String, required: true },
    password: { type: String, required: true },
    identityImage: { type: String, required: true },
    deliveryManImage: { type: String, required: true },
    deliveryManType: { type: String, required: true },
    identiyType: { type: String, required: true },
    deliveryManStatus: { type: Boolean, default: false },

    late: { type: Number, default: 0 },
    long: { type: Number, default: 0 },

    accepted: { type: Boolean, default: false },

    paid: {
        type: Number,
        default: 0
    },
    commission: {
        type: Number,
        default : 2,
    },
    rate: {
        type: mongoose.Schema.Types.Number,
        default: 5.0
    },
    fcmToken: {
        type: String,
    }

}, { versionKey: false, timestamps: true, })

module.exports = mongoose.model("deliverers", deliverersSchema);