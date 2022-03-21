const router = require('express').Router()
const categoryModel = require('../models/category_model')
const restaurant_model = require('../models/restaurant_model')
const notification_model = require('../models/notification_model')

// get all categories
router.get('/', async (req, res) => {

    try {
        const result = await categoryModel.find({})
        res.json(result)
    } catch (e) {

        res.sendStatus(500)
    }
})
router.get('/notifications', async (req, res) => {
    try {
        const result = await notification_model.find({})
        res.json(result)
    } catch (e) {

        res.sendStatus(500)
    }
})
router.get('/:cat', async (req, res) => {

    try {

        const result = await restaurant_model.find({
            cats: { $in: [req.params.cat] }
        })

        res.json(result)

    }
    catch (e) {
        console.log(e)
        res.sendStatus(500)
    }
})
module.exports = router