const mongoose = require('mongoose')


const couponsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    code: { type: String, required: true },
    usage: { type: Number, default: 0 },
    largest_users: { type: Number, required: true },
    rest_id: { type: String, required: true },
    is_percentage: { type: Boolean, required: true },
    value: { type: Number, required: true },
    start_date: { type: Number, required: true },
    end_date: { type: Number, required: true },
    biggest_discount: { type: Number, required: true },
    less_purchase: { type: Number, required: true },
    active: { type: Boolean, default: true },
}, { versionKey: false, timestamps: true, })

module.exports = mongoose.model("coupons", couponsSchema);


