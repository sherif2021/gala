const router = require('express').Router()
const food_model = require('../models/food_model')
const coupon_model = require('../models/coupon_model')


router.get('/offers', async (req, res) => {

    try {

        const result = await food_model.find({
            'is_offer': true,
            'active': true,
            'accepted': true,
        })

        res.json(result)

    } catch (e) {

        res.sendStatus(500)
    }
})

router.post('/search', async (req, res) => {
    try {

        const { data } = req.body


        const result = await food_model.find(
            {
                'active': true,
                'accepted': true,
                $or: [{ mealName: { $regex: '.*' + data + '.*', $options: 'i' } }, { mealDescription: { $regex: '.*' + data + '.*', $options: 'i' } }]
            }).limit(20)

        res.json(result)

    } catch (e) {
        res.sendStatus(500)
    }
})


// get coupons
router.get('/coupons', async (req, res) => {

    try {
        const result = await coupon_model.find({})

        res.json(result)

    } catch (e) {

        res.sendStatus(500)
    }
})
// get all foods by cat
router.get('/:rest', async (req, res) => {

    try {

        if (req.params.rest) {
            const result = await food_model.find({
                'restaurantId': req.params.rest,
                'active': true,
                'accepted': true,
            })

            res.json(result)
        } else {
            res.sendStatus(500)
        }
    } catch (e) {

        res.sendStatus(500)
    }
})

module.exports = router