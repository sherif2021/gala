const router = require('express').Router()
const delivery_model = require('../models/delivery_model')
const real_time = require('../real_time')
const { verifyTokenAndDelivery, createToken, decryptText } = require('../helper')


router.post('/login', async (req, res) => {


    try {
        const { mail, password, fcmToken } = req.body

        if (mail && password) {


            const result = await delivery_model.findOneAndUpdate({ mail }, fcmToken)

            if (result && result.accepted && decryptText(result.password) == password) {

                res.json({
                    'token': createToken(
                        result._id,
                        false,
                        false,
                        true
                    )
                })
            } else {

                res.status(400).json({
                    message: 'invalid informations or Account not accpeted.'
                })

            }


        } else {
            res.sendStatus(400)
        }

    } catch (e) {
        res.sendStatus(500)
    }
})

router.post('/status', verifyTokenAndDelivery, async (req, res) => {

    try {

        const { deliveryManStatus } = req.body

        const result = await delivery_model.findOneAndUpdate({ _id: req.user.id }, { deliveryManStatus })


        if (result) {
            res.json({ 'message': 'success' })

            real_time.restaurants.forEach(e => {
                e.send(
                    JSON.stringify({
                        'type': 'delivery_status_changed', 'data': {
                            'delivery': req.user.id,
                            'status': deliveryManStatus
                        }
                    })
                )
            })
            // send to admin and rest

        } else {
            res.json({ 'message': 'failed' })
        }
    } catch (e) {
        console.log(e)
        res.sendStatus(500)
    }
})
module.exports = router