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

function deleteAll() {

    category_model.deleteMany({})
    food_model.deleteMany({})
    rest_model.deleteMany({})
    food_model.deleteMany({})
}