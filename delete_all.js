const mongoose = require('mongoose')
const category_model = require('./models/category_model')
const food_model = require('./models/food_model')
const order_model = require('./models/order_model')
const rest_model = require('./models/restaurant_model')

require("dotenv").config();


mongoose.connect(process.env.MONGODB_URI,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('Database Connected')
        deleteAll()
    }).catch((e) => {
        console.error(e)
    });

async function deleteAll() {

    try {
        await category_model.deleteMany({}).exec()
        await food_model.deleteMany({}).exec()
        await order_model.deleteMany({}).exec()
        await rest_model.deleteMany({}).exec()
        console.log('here')
    } catch (e) {
        console.log(e)
    }
}