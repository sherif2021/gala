const router = require('express').Router()
const restaurant_model = require('../models/restaurant_model')
const food_model = require('../models/food_model')
const delivery_model = require('../models/delivery_model')
const category_model = require('../models/category_model')
const coupon_model = require('../models/coupon_model')
const notification_model = require('../models/notification_model')
const user_model = require('../models/user_model')
const real_time = require('../real_time')

const { encryptText, decryptText, verifyTokenAndAdmin, createToken, sendNotificationToAll } = require('../helper')


router.post('/login', async (req, res) => {

    try {
        const { username, password } = req.body

        if (process.env.ADMIN_USERNAME == username && process.env.ADMIN_PASSWORD == password) {

            res.json({
                'token': createToken('admin', true, false, false)
            })
        } else {
            res.sendStatus(500)
        }

    } catch (e) {
        res.sendStatus(500)
    }

})

// get all restaurants
router.get('/restaurants', verifyTokenAndAdmin, async (req, res) => {

    try {
        const result = await restaurant_model.find({})

        result.forEach(e => {
            e._doc.password = decryptText(e._doc.password)
        })

        res.json(result)

    } catch (e) {

        res.sendStatus(500)
    }
})


// get all foods by rest
router.get('/foods/:rest', verifyTokenAndAdmin, async (req, res) => {


    try {

        const result = await food_model.find({
            'restaurantId': req.params.rest,
            'accepted': true,
        })
        res.json(result)

    } catch (e) {

        res.sendStatus(500)
    }
})


// get all foods by cat
router.get('/foods/', verifyTokenAndAdmin, async (req, res) => {


    try {

        const result = await food_model.find({ accepted: true })

        res.json(result)


    } catch (e) {

        res.sendStatus(500)
    }
})

// create delivery
router.post('/deliverers', verifyTokenAndAdmin, async (req, res) => {

    try {
        const { name, phone, identityNumber, mail, password, identityImage, deliveryManImage, deliveryManType, identiyType } = req.body


        if (name && phone && identityNumber && mail && password && identityImage && deliveryManImage && deliveryManType && identiyType) {


            const existDelivery = await delivery_model.findOne({ mail })


            if (!existDelivery) {

                const newDelivery = new delivery_model({
                    name, phone, identityNumber, mail, password: encryptText(password),
                    identityImage, deliveryManImage, deliveryManType, identiyType,
                    added_by: 'admin',
                    accepted: true
                })

                const result = await newDelivery.save()

                result._doc.password = decryptText(result._doc.password)

                res.json(result)

                // send to rests

            } else {
                res.status(400).json({
                    'message': 'email is exist'
                })
            }

        } else {
            res.sendStatus(500)
        }
    } catch (e) {
        console.log(e)
        res.sendStatus(500)
    }
})


router.delete('/deliverers/:id', verifyTokenAndAdmin, async (req, res) => {

    try {


        const result = await delivery_model.findOneAndDelete({ _id: req.params.id })

        res.json(result ? 'success' : 'failed')


    } catch (e) {

        console.log(e)
        res.sendStatus(500)
    }
})

// set rest active
router.get('/activeRestaurant/:id', verifyTokenAndAdmin, async (req, res) => {

    try {
        const result = await restaurant_model.findOneAndUpdate({ _id: req.params.id }, { 'active': true })

        if (result) {
            res.json({ 'message': 'success' })

        } else {
            res.json({ 'message': 'failed' })
        }

    } catch (e) {

        res.sendStatus(500)
    }
})


// set rest not active
router.get('/unActiveRestaurant/:id', verifyTokenAndAdmin, async (req, res) => {

    try {
        const result = await restaurant_model.findOneAndUpdate({ _id: req.params.id }, { 'active': false })

        if (result) {
            res.json({ 'message': 'success' })

        } else {
            res.json({ 'message': 'failed' })
        }

    } catch (e) {

        res.sendStatus(500)
    }
})


// set food active
router.get('/activeFood/:id', verifyTokenAndAdmin, async (req, res) => {

    try {
        const result = await food_model.findOneAndUpdate({ _id: req.params.id }, { 'active': true })


        if (result) {
            res.json({ 'message': 'success' })

        } else {
            res.json({ 'message': 'failed' })
        }

    } catch (e) {

        res.sendStatus(500)
    }
})


// set rest not active
router.get('/unActiveFood/:id', verifyTokenAndAdmin, async (req, res) => {

    try {
        const result = await food_model.findOneAndUpdate({ _id: req.params.id }, { 'active': false })


        if (result) {
            res.json({ 'message': 'success' })

        } else {
            res.json({ 'message': 'failed' })
        }

    } catch (e) {

        res.sendStatus(500)
    }
})

// create restaurant
router.post('/restaurants', verifyTokenAndAdmin, async (req, res) => {


    try {
        const { name, address, taxesNumber, minimumDeliveryTime, maximumDeliveryTime, latitude, longitude, logo, cover, ownerName, phoneNumber, mail, password, avtive, openTime, closeTime } = req.body


        if (name && address && taxesNumber && minimumDeliveryTime && maximumDeliveryTime && latitude && longitude && logo && cover && ownerName && phoneNumber && mail && password) {

            const existRest = await restaurant_model.findOne({ mail })

            if (!existRest) {
                const newRestaurant = new restaurant_model({
                    name, address, taxesNumber, minimumDeliveryTime, maximumDeliveryTime, latitude, longitude, logo, cover, ownerName, phoneNumber, mail,
                    active: avtive != 0,
                    openTime, closeTime,
                    accepted: true,
                    password: encryptText(password)
                })

                const result = await newRestaurant.save()

                result._doc.password = decryptText(result._doc.password)
                res.json(result)

            } else {
                res.sendStatus(400)
            }
        } else {

            res.sendStatus(500)
        }
    } catch (e) {

        console.log(e)
        res.sendStatus(500)
    }
})


// create food
router.post('/foods', verifyTokenAndAdmin, async (req, res) => {

    try {


        req.body.accepted = true
        req.body.added_by = 'admin'

        const newFood = new food_model(req.body)

        const result = await newFood.save()


        res.json(result)

        restaurant_model.updateOne(
            {
                _id: result.restaurantId,
            },
            { $addToSet: { cats: result.categoryId } }
        ).exec()
    } catch (e) {

        console.log(e)
        res.sendStatus(500)
    }
})

// delete food
router.delete('/foods/:id', verifyTokenAndAdmin, async (req, res) => {

    try {


        const result = await food_model.findOneAndDelete({ _id: req.params.id })

        res.json(result ? 'success' : 'failed')

        if (result) {
            const r = await food_model.findOne({
                restaurantId: result.restaurantId, categoryId: result.categoryId
            })

            if (!r) {
                restaurant_model.updateOne(
                    {
                        _id: result.restaurantId,
                    },
                    {
                        $pullAll: {
                            cats: [result.categoryId],
                        }
                    }
                )
            }
        }
    } catch (e) {

        console.log(e)
        // res.sendStatus(500)
    }
})


// add category
router.post('/categories', verifyTokenAndAdmin, async (req, res) => {

    try {
        
        const { name, image } = req.body


        if (name && image) {

            const newCategory = new category_model({
                name, image, accepted: true,
                added_by: 'admin'
            })
            const result = await newCategory.save()

            res.json(result)

        } else {

            res.sendStatus(500)
        }
    } catch (e) {

        console.log(e)
        res.sendStatus(500)
    }
})

// delete category
router.delete('/categories/:id', verifyTokenAndAdmin, async (req, res) => {

    try {
        if (req.params.id) {

            const result = await category_model.deleteOne({ _id: req.params.id })

            res.json(result ? 'success' : 'failed')

        } else {
            res.sendStatus(500)
        }
    } catch (e) {

        res.sendStatus(500)
    }
})

// get review foods
router.get('/reviewFoods', verifyTokenAndAdmin, async (req, res) => {

    try {

        const result = await food_model.find({
            'accepted': false,
        })

        res.json(result)

    } catch (e) {

        console.log(e)
        res.sendStatus(500)
    }
})

// get review Categories
router.get('/reviewCategories', verifyTokenAndAdmin, async (req, res) => {

    try {

        const result = await category_model.find({
            'accepted': false,
        })

        res.json(result)

    } catch (e) {

        res.sendStatus(500)
    }
})

// get review Deliverers
router.get('/reviewDeliverers', verifyTokenAndAdmin, async (req, res) => {

    try {

        const result = await delivery_model.find({
            'accepted': false,
        })

        res.json(result)

    } catch (e) {

        res.sendStatus(500)
    }
})


// approve review food
router.get('/approveFoods/:id', verifyTokenAndAdmin, async (req, res) => {

    try {


        const food = await food_model.findOneAndUpdate({ _id: req.params.id }, { 'accepted': true })

        real_time.sendRestData(
            food.restaurantId,
            'new_food',
            food
        )

        res.json(food)

        restaurant_model.updateOne(
            {
                _id: food.restaurantId,
            },
            { $addToSet: { cats: food.categoryId } }
        )

    } catch (e) {

        res.sendStatus(500)
    }
})


// approve review category
router.get('/approveCategories/:id', verifyTokenAndAdmin, async (req, res) => {

    try {

        const category = await category_model.findOneAndUpdate({ _id: req.params.id }, { 'accepted': true })

        real_time.sendToAllRestData(
            'new_cat',
            category
        )
        res.json(category)

    } catch (e) {

        res.sendStatus(500)
    }
})



// approve review delivery
router.get('/approveDeliveries/:id', verifyTokenAndAdmin, async (req, res) => {

    try {

        const delivery = await delivery_model.findOneAndUpdate({ _id: req.params.id }, { 'accepted': true })

        real_time.sendToAllRestData(
            'new_delivery',
            delivery
        )

        res.json(delivery)


    } catch (e) {

        res.sendStatus(500)
    }
})

// get coupons
router.get('/coupons', verifyTokenAndAdmin, async (req, res) => {

    try {


        const result = await coupon_model.find({})

        res.json(result)

    } catch (e) {

        res.sendStatus(500)
    }
})

// add coupon
router.post('/coupons', verifyTokenAndAdmin, async (req, res) => {

    try {

        const exist = await coupon_model.findOne({ code: req.body.code })


        if (!exist) {
            const model = new coupon_model(req.body)

            const result = await model.save()

            res.json(result)

        } else {
            res.sendStatus(500)
        }
    } catch (e) {
        res.sendStatus(500)
    }
})

router.get('/activeCoupon/:id', verifyTokenAndAdmin, async (req, res) => {

    try {
        const result = await coupon_model.findOneAndUpdate({ _id: req.params.id }, { 'active': true })

        if (result) {
            res.json({ 'message': 'success' })

        } else {
            res.json({ 'message': 'failed' })
        }

    } catch (e) {

        res.sendStatus(500)
    }
})


router.get('/unActiveCoupon/:id', verifyTokenAndAdmin, async (req, res) => {

    try {
        const result = await coupon_model.findOneAndUpdate({ _id: req.params.id }, { 'active': false })

        if (result) {
            res.json({ 'message': 'success' })

        } else {
            res.json({ 'message': 'failed' })
        }

    } catch (e) {

        res.sendStatus(500)
    }
})

router.put('/editCategory', verifyTokenAndAdmin, async (req, res) => {

    try {

        const result = await category_model.findOneAndUpdate({ _id: req.body.id }, req.body)

        if (result) {
            res.json({ 'message': 'success' })

        } else {
            res.json({ 'message': 'failed' })
        }

    } catch (e) {
        res.sendStatus(500)
    }

})
router.put('/editFood', verifyTokenAndAdmin, async (req, res) => {

    try {

        const result = await food_model.findOneAndUpdate({ _id: req.body.id }, req.body)

        if (result) {
            res.json({ 'message': 'success' })

        } else {
            res.json({ 'message': 'failed' })
        }

    } catch (e) {
        res.sendStatus(500)
    }

})
router.put('/editDelivery', verifyTokenAndAdmin, async (req, res) => {

    try {

        req.body.password = encryptText(req.body.password)
        const result = await delivery_model.findOneAndUpdate({ _id: req.body.id }, req.body)
        if (result) {
            res.json({ 'message': 'success' })

        } else {
            res.json({ 'message': 'failed' })
        }

    } catch (e) {
        res.sendStatus(500)
    }
})

router.put('/editRestaurant', verifyTokenAndAdmin, async (req, res) => {

    try {

        req.body.password = encryptText(req.body.password)
        const result = await restaurant_model.findOneAndUpdate({ _id: req.body.id }, req.body)
        if (result) {
            res.json({ 'message': 'success' })

        } else {
            res.json({ 'message': 'failed' })
        }

    } catch (e) {
        res.sendStatus(500)
    }
})
router.get('/deliverers', verifyTokenAndAdmin, async (req, res) => {

    try {
        const result = await delivery_model.find({ 'accepted': true })

        result.forEach(e => {
            e._doc.password = decryptText(e._doc.password)
        })
        res.json(result)
    } catch (e) {

        res.sendStatus(500)
    }
})

router.post('/notification', verifyTokenAndAdmin, async (req, res) => {

    try {
        const newNotification = new notification_model(
            req.body
        )

        const result = await newNotification.save()
        res.json(result)
    } catch (e) {

        res.sendStatus(500)
    }
})
router.delete('/notification/:id', verifyTokenAndAdmin, async (req, res) => {
    try {
        const result = await notification_model.findOneAndDelete({ _id: req.params.id })

        res.json(result ? 'success' : 'failed')
    } catch (e) {

        res.sendStatus(500)
    }
})
router.post('/restPaid', verifyTokenAndAdmin, async (req, res) => {

    try {
        const { restId, paid } = req.body

        const result = await restaurant_model.findOneAndUpdate({ _id: restId }, { $inc: { 'paid': paid } })

        res.json(result ? 'success' : 'failed')
    } catch (e) {

        res.sendStatus(500)
    }
})
router.post('/deliveryPaid', verifyTokenAndAdmin, async (req, res) => {

    try {
        const { deliveryId, paid } = req.body

        const result = await delivery_model.findOneAndUpdate({ _id: deliveryId }, { $inc: { 'paid': paid } })

        res.json(result ? 'success' : 'failed')
    } catch (e) {

        res.sendStatus(500)
    }
})
router.post('/sendNotification', verifyTokenAndAdmin, async (req, res) => {

    try {
        const { title, subTitle } = req.body


        const result = await sendNotificationToAll(title, subTitle)


        res.json(result ? 'success' : 'failed')
    } catch (e) {

        console.log(e)
        res.sendStatus(500)
    }

})
module.exports = router