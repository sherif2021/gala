const mongoose = require('mongoose')


const foodsSchema = new mongoose.Schema({
    restaurantId: { type: String, require: true },
    categoryId: { type: String, required: true },
    mealName: { type: String, required: true },
    price: { type: Number, required: true },
    mealDescription: { type: String, required: true },
    mealImage: { type: String, required: true },

    // Offers

    is_offer: { type: Boolean, default: false },
    is_percentage_offer: { type: Boolean, default: false },
    offer_value: { type: Number, default: 0 },
    start_offer_date: { type: Number, default: 0 },
    end_offer_date: { type: Number, default: 0 },


    //


    added_by: { type: String, required: true },
    active: { type: Boolean, default: true },
    accepted: { type: Boolean, default: false },

   

}, { versionKey: false, timestamps: true, })

module.exports = mongoose.model("foods", foodsSchema);