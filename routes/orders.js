const router = require('express').Router()
const order_model = require('../models/order_model')
const food_model = require('../models/food_model')
const restaurant_model = require('../models/restaurant_model')

const real_time = require('../real_time')
const coupon_model = require('../models/coupon_model')
const { verifyToken } = require('../helper')

router.post('/', verifyToken, async (req, res) => {

    
    try {
        const {
            restId,
            userId,
            userName,
            userPhone,
            meals,
            orderTime,
            delivery,
            userAddress,
            userLatitude,
            userLongitude,
            couponCode,

        } = req.body

        if (restId && userId && userName && userPhone && meals && orderTime) {


            const rest = await restaurant_model.findById(restId)

            if (rest && rest.active && !rest.isBusy && new Date().getHours() <= rest.closeDate) {

                const foodIds = meals.map(e => {
                    return e.mealId
                })

                const foods = await food_model.where('_id').in(foodIds)

                var totalCost = 0
                foods.forEach(e => {

                    meals.forEach(meal => {

                        if (meal.mealId == e._id) {

                            meal.cost = meal.number * calcFoodPrice(e)
                            totalCost += meal.cost
                        }
                    })
                })

                var couponModel = null

                if (couponCode && couponCode != '') {


                    const coupon = await coupon_model.findOne({
                        active: true,
                        code: couponCode,
                        rest_id: rest._id,
                    })
                    if (coupon) {


                        const now = new Date().getTime()

                        if (now >= coupon.start_date && now <= coupon.end_date && coupon.usage < coupon.largest_users
                            && totalCost >= coupon.less_purchase) {

                            couponModel = coupon
                            coupon_model.updateOne({
                                _id: coupon._d,
                            },
                                { usage: coupon.usage + 1 }
                            ).exec()

                        } else {

                            return res.json({
                                'message': 'coupon is expired.'
                            })
                        }

                    } else {
                        return res.json({
                            'message': 'coupon is not valid.'
                        })

                    }
                }


                const lastOrder = await order_model.findOne({}, {}, { sort: { 'orderNumber': -1 }, 'select': 'orderNumber' }).exec()

                const orderModel = new order_model({
                    restId,
                    userId: req.user.id,
                    userPhone,
                    userName,
                    meals,
                    orderTime,
                    delivery: delivery ?? false,
                    deliveryCost: rest.deliveryPrice,
                    userAddress,
                    userLatitude,
                    userLongitude,
                    orderNumber: lastOrder ? lastOrder.orderNumber + 1 : 1,
                    commission: rest.commission ?? 2,
                    couponCode,
                    coupon: couponModel,
                })

                const result = await orderModel.save()

                result._doc.restName = rest.name
                result._doc.restCover = rest.cover
                result._doc.deliveryTime = rest.maximumDeliveryTime

                real_time.sendRestData(
                    restId,
                    'new_order',
                    result
                )
                real_time.sendToAdmins(
                    'new_order',
                    result
                )

                res.json(result)

            } else {

                res.json({
                    'message': 'Restaurant is not available now try agian later.'
                })
            }
        } else {
            res.sendStatus(400)
        }

    } catch (e) {
        console.log(e)
        res.sendStatus(500)
    }

})

router.get('/cancel/:orderId', verifyToken, async (req, res) => {
    try {

        const result = await order_model.findOneAndUpdate({ _id: req.params.orderId, userId: req.user.id, accepted: false, }, {
            declined: true,
        })

        console.log(result)
        res.json({
            'status': result != null
        })
        // send to rests
        // send to admin
        real_time.sendRestData(
            result.restId,
            'order_cancel',
            result._id,
        )

        real_time.sendToAdmins(
            'order_cancel',
            result._id,
        )

    } catch (e) {
        console.log(e)
        res.sendStatus(500)
    }

})
router.get('/:userId', async (req, res) => {

    try {

        const result = await order_model.where({ userId: req.params.userId })

        if (result) {


            const restIds = []
            result.forEach(e => {
                if (!restIds.includes(e._doc.restId)) restIds.push(e._doc.restId)
            })


            const rests = await restaurant_model.where({ _id: { $in: restIds } }).select('name cover maximumDeliveryTime')


            result.forEach(order => {
                for (const rest of rests) {
                    if (order._doc.restId == rest._doc._id) {
                        order._doc.restName = rest._doc.name
                        order._doc.restCover = rest._doc.cover
                        order._doc.deliveryTime = rest._doc.maximumDeliveryTime

                        break
                    }
                }
            })

            res.json(result)

        } else
            res.json([])
    } catch (e) {
        console.log(e)
        res.sendStatus(500)
    }
})

const calcFoodPrice = (food) => {

    const now = new Date().getTime()

    if (!food.is_offer || (food.is_offer && (food.start_offer_date < now || end_offer_date > now))) return food.price

    else {

        if (food.is_percentage_offer) return food.price - ((food.offer_value / 100) * food_model.price)

        else return food.price - food.offer_value
    }
}


module.exports = router