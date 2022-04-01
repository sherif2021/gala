const router = require('express').Router()
const food_model = require('../models/food_model')
const restaurant_model = require('../models/restaurant_model')
const { verifyTokenAndRestaurant, decryptText, encryptText, createToken, senNotification } = require('../helper')
const delivery_model = require('../models/delivery_model')
const order_model = require('../models/order_model')
const user_model = require('../models/user_model')
const real_time = require('../real_time')
const category_model = require('../models/category_model')
const coupon_model = require('../models/coupon_model')

router.post('/login', async (req, res) => {

    try {
        const { mail, password } = req.body

        const result = await restaurant_model.findOne({ mail })

        if (result) {

            if (decryptText(result._doc.password) == password) {

                res.json({
                    'token': createToken(result._id, false, true, false)
                })

            } else {
                res.sendStatus(500)

            }

        } else {
            res.sendStatus(500)

        }

    } catch (e) {
        console.log(e)
        res.sendStatus(500)
    }

})

// for rest
router.get('/foods', verifyTokenAndRestaurant, async (req, res) => {


    try {

        const foods = await food_model.find({ 'restaurantId': req.user.id, 'accepted': true })


        res.json(foods)

    } catch (e) {
        res.sendStatus(500)
    }

})
// for rest
router.get('/myRestInfo', verifyTokenAndRestaurant, async (req, res) => {


    try {

        const result = await restaurant_model.findOne({ _id: req.user.id })


        if (result) {

            delete result._doc.password

            res.json(result._doc)

        } else {
            res.status(400).json({
                'message': 'restaurant not exist'
            })
        }
    } catch (e) {
        res.sendStatus(500)
    }

})

router.post('/changeRestInfo', verifyTokenAndRestaurant, async (req, res) => {
    try {


        const { isBusy, isOpen, openDate, closeDate, lowestOrderPrice, deliveryPrice } = req.body


        const result = await restaurant_model.findByIdAndUpdate(
            req.user.id,
            {
                $set: { isBusy, isOpen, openDate, closeDate, lowestOrderPrice, deliveryPrice },
            },
            { new: true }
        )


        if (result) {

            delete result._doc.password

            res.json(result._doc)

        } else {

            res.status(400).json({
                'message': 'restaurant not exist'
            })
        }

    } catch (e) {
        console.log(e)
        res.sendStatus(500)
    }

})


// add delivery
router.post('/addDelivery', verifyTokenAndRestaurant, async (req, res) => {


    try {
        const { name, phone, identityNumber, mail, password, identityImage, deliveryManImage, deliveryManType, identiyType } = req.body


        if (name && phone && identityNumber && mail && password && identityImage && deliveryManImage && deliveryManType && identiyType) {


            const existDelivery = await delivery_model.findOne({ mail })


            if (!existDelivery) {

                const newDelivery = new delivery_model({
                    name, phone, identityNumber, mail, password: encryptText(password),
                    identityImage, deliveryManImage, deliveryManType, identiyType,
                    added_by: req.user.id,
                })

                const result = await newDelivery.save()

                result._doc.password = decryptText(result._doc.password)

                res.json(result)

                real_time.sendToAdmins(
                    'new_review_delivery',
                    result
                )

            } else {
                res.status(400).json({
                    'message': 'email is exist'
                })
            }

        } else {
            res.sendStatus(500)
        }
    } catch (e) {
        res.sendStatus(500)
    }
})

// add category
router.post('/addCategory', verifyTokenAndRestaurant, async (req, res) => {


    try {

        req.body.accepted = false
        req.body.added_by = req.user.id

        const newCategory = new category_model(req.body)

        const result = await newCategory.save()


        real_time.sendToAdmins(
            'new_review_cat',
            result
        )

        res.json(result)


    } catch (e) {
        res.sendStatus(500)
    }
})

// add food
router.post('/addFood', verifyTokenAndRestaurant, async (req, res) => {



    try {


        req.body.accepted = false
        req.body.added_by = req.user.id
        req.body.restaurantId = req.user.id

        const newFood = new food_model(req.body)

        const result = await newFood.save()

        res.json(result)

        real_time.sendToAdmins(
            'new_review_food',
            result
        )

    } catch (e) {

        console.log(e)
        res.sendStatus(500)
    }
})

//delete food
router.delete('/foods/:id', verifyTokenAndRestaurant, async (req, res) => {
    try {


        const item = await food_model.deleteOne({ _id: req.params.id, restaurantId: req.user.id })

        res.json({
            'status': item ? 'success' : 'failed'
        })

        if (item) {
            real_time.sendToAdmins(
                'rest_delete_food',
                req.params.id
            )

            const r = await food_model.findOne({
                restaurantId: item.restaurantId, categoryId: item.categoryId
            })

            if (!r) {

                await restaurant_model.updateOne(
                    {
                        _id: item.restaurantId,
                    },
                    {
                        $pullAll: {
                            cats: [item.categoryId],
                        }
                    }
                ).exec()
            }
        }

    } catch (e) {

        console.log(e)
        res.sendStatus(500)
    }

})

router.get('/orders', verifyTokenAndRestaurant, async (req, res) => {

    try {

        const result = await order_model.where({ restId: req.user.id })

        const userIds = []
        result.forEach(e => {
            if (e.userId.length == 24)
                return e.userId
        })

        if (userIds.length > 0) {
            const users = await user_model.find({ _id: { $in: userIds } });

            result.forEach(e => {

                users.forEach(e => {
                    if (e._id == result.userId) {
                        result.user_name = e.name
                        return;
                    }
                })
            })
        }

        res.json(result)

    } catch (e) {
        console.log(e)
        res.sendStatus(500)
    }
})


router.get('/approveOrder/:id', verifyTokenAndRestaurant, async (req, res) => {

    try {


        const result = await order_model.findByIdAndUpdate(
            { _id: req.params.id, restId: req.user.id },
            {
                $set: { accepted: true },
            },
            { new: false }
        )



        if (result) {


            real_time.sendToAdmins('rest_approve_order',
                result._id,
            )

            real_time.sendUserData(
                result.userId,
                'order_approved',
                result._id,
            )

            user_model.findById(result.userId).select('fcmToken').then(r => {
                if (r && r.fcmToken) {
                    senNotification(r.fcmToken, 'تم قبول الطلب من المطعم', 'تم قبول الطلب')
                }
            })

            res.json({ 'status': true })
        }
        else {
            res.json({ 'status': false })
        }


    } catch (e) {
        console.log(e)
        res.sendStatus(500)
    }
})

router.post('/setOrderCooked/:id', verifyTokenAndRestaurant, async (req, res) => {

    try {


        const { delivery } = req.body

        const result = await order_model.findByIdAndUpdate(
            { _id: req.params.id, restId: req.user.id },
            {
                $set: { cooked: true },
            },
            { new: false }
        )


        if (result) {

            real_time.sendToAdmins(
                'rest_cooked_order',
                result._id
            )

            real_time.sendUserData(
                result.userId,
                'order_cooked',
                result._id,
            )

            if (delivery) {

                real_time.sendDeliveryData(
                    delivery,
                    'request_order',
                    result

                )
            }

            else {

                real_time.deliverers.forEach(e => {

                    real_time.sendDeliveryData(e.id, 'new_order', result)
                })
            }

            res.json({ 'status': true })
        }
        else {
            res.json({ 'status': false })
        }


    } catch (e) {
        console.log(e)
        res.sendStatus(500)
    }
})
router.get('/cancelOrder/:id', verifyTokenAndRestaurant, async (req, res) => {

    try {


        const result = await order_model.findByIdAndUpdate(
            { _id: req.params.id, restId: req.user.id },
            {
                $set: { declined: true, deliveryId: '' },
            },
            { new: false }
        )

        // check if order has delivery and send cancel case 
        // send cancel case to client

        if (result) {
            real_time.sendToAdmins(
                'rest_cancel_order',
                result._id
            )
            real_time.sendUserData(
                result.userId,
                'order_canceled',
                result._id,
            )

            real_time.deliverers.forEach(e => {

                if (e.currentOrder == result._id) {
                    e.currentOrder = null
                    e.currentRest = null
                    e.currentUser = null
                    real_time.sendDeliveryData(e.id, 'cancel_order', result._id)
                }
            })

            user_model.findById(result.userId).select('fcmToken').then(r => {
                if (r && r.fcmToken) {
                    senNotification(r.fcmToken, 'تم الغاء الطلب من المطعم', 'تم الغاء الطلب')
                }
            })
            res.json({ 'status': true })
        }
        else {
            res.json({ 'status': false })
        }


    } catch (e) {
        console.log(e)
        res.sendStatus(500)
    }
})

// get coupons
router.get('/coupons', verifyTokenAndRestaurant, async (req, res) => {

    try {


        const result = await coupon_model.find({
            'rest_id': req.user.id
        })

        res.json(result)

    } catch (e) {

        res.sendStatus(500)
    }
})

// add coupon
router.post('/coupons', verifyTokenAndRestaurant, async (req, res) => {

    try {

        const exist = await coupon_model.findOne({ code: req.body.code })

        if (!exist) {
            req.body.rest_id = req.user.id
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

router.get('/activeCoupon/:id', verifyTokenAndRestaurant, async (req, res) => {

    try {
        const result = await coupon_model.findOneAndUpdate({ _id: req.params.id, rest_id: req.user.id }, { 'active': true })

        if (result) {
            res.json({ 'message': 'success' })

        } else {
            res.json({ 'message': 'failed' })
        }

    } catch (e) {

        res.sendStatus(500)
    }
})


router.get('/unActiveCoupon/:id', verifyTokenAndRestaurant, async (req, res) => {

    try {
        const result = await coupon_model.findOneAndUpdate({ _id: req.params.id, rest_id: req.user.id }, { 'active': false })

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
router.get('/activeFood/:id', verifyTokenAndRestaurant, async (req, res) => {

    try {
        const result = await food_model.findOneAndUpdate({ _id: req.params.id, restaurantId: req.user.id }, { 'active': true })


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
router.get('/unActiveFood/:id', verifyTokenAndRestaurant, async (req, res) => {

    try {
        const result = await food_model.findOneAndUpdate({ _id: req.params.id, restaurantId: req.user.id }, { 'active': false })


        if (result) {
            res.json({ 'message': 'success' })

        } else {
            res.json({ 'message': 'failed' })
        }

    } catch (e) {

        res.sendStatus(500)
    }
})

router.put('/editFood', verifyTokenAndRestaurant, async (req, res) => {

    try {

        req.body.restaurantId = req.user.id

        const result = await food_model.findOneAndUpdate({ _id: req.body.id, restaurantId: req.user.id }, req.body)

        if (result) {
            res.json({ 'message': 'success' })

        } else {
            res.json({ 'message': 'failed' })
        }

    } catch (e) {
        res.sendStatus(500)
    }

})
module.exports = router