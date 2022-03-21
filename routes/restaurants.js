const router = require('express').Router()
const restaurant_model = require('../models/restaurant_model')
const { encryptText, decryptText, verifyToken } = require('../helper')
const rating_model = require('../models/rating_model')
const delivery_model = require('../models/delivery_model')


// get all restaurants
router.get('/', async (req, res) => {

    try {
        const result = await restaurant_model.find({ 'active': true })


        result.forEach(e => {
            delete e._doc.mail
            delete e._doc.password
        })
        res.json(result)


    } catch (e) {

        res.sendStatus(500)
    }
})
router.get('/reviews/:restId', async (req, res) => {

    try {
        const result = await rating_model.find({ 'restId': req.params.restId })

        res.json(result)


    } catch (e) {

        res.sendStatus(500)
    }
})
router.post('/rate', verifyToken, async (req, res) => {

    try {
        console.log(req.body)
        const
            { restId,
                deliveryId,
                comment,
                deliveryQuality,
                foodQuality,
                qualityForThePrice,
                orderPacking } = req.body


        const result = await rating_model.findOneAndUpdate({ restId, userId: req.user.id }, {

            deliveryQuality,
            foodQuality,
            qualityForThePrice,
            orderPacking,
            comment
        }, { upsert: true, setDefaultsOnInsert: true, new: true })

        res.json(result)
        updateRestRating(restId, deliveryId)


    } catch (e) {

        res.sendStatus(500)
    }
})
// get restaurant
router.get('/:id', async (req, res) => {

    try {

        const result = await restaurant_model.findOne({ _id: req.params.id })

        if (result) {

            delete result._doc.mail
            delete result._doc.password

            res.json(result)

        } else {
            res.sendStatus(404)
        }

    } catch (e) {

        console.log(e)
        res.sendStatus(500)
    }
})
async function updateRestRating(restId, deliveryId) {

    try {

        const result = await rating_model.aggregate(
            [
                { $match: { restId } },
                {
                    $group:
                    {
                        _id: restId,
                        foodQuality: { $sum: "$foodQuality" },
                        qualityForThePrice: { $sum: "$qualityForThePrice" },
                        orderPacking: { $sum: "$orderPacking" },
                        count: { $sum: 1 }
                    }
                }
            ]
        )
        if (result.length > 0) {


            var all = (result[0].foodQuality + result[0].qualityForThePrice + result[0].orderPacking) / 3

            var rating = all / result[0].count

            restaurant_model.updateOne({
                _id: restId,
            },
                { rate: rating }
            ).exec()
        }
        const deliveryRate = await rating_model.aggregate(
            [
                { $match: { deliveryId } },
                {
                    $group:
                    {
                        deliveryQuality: { $sum: "$deliveryQuality" },
                        count: { $sum: 1 }
                    }
                }
            ]
        )
        if (deliveryRate.length > 0) {


            var rating = deliveryRate[0].deliveryQuality / deliveryRate[0].count

            delivery_model.updateOne({
                _id: deliveryId,
            },
                { rate: rating }
            ).exec()
        }

    } catch (e) {

        console.log(e)
    }

}
module.exports = router