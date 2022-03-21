const router = require('express').Router()
const restaurant_model = require('../models/restaurant_model')
const { decryptText, createToken } = require('../helper')
const user_model = require('../models/user_model')
const firebaseAdmin = require('firebase-admin')
const order_model = require('../models/order_model')
const rating_model = require('../models/rating_model')

router.post('/restaurantLogin', async (req, res) => {


    try {
        const { mail, password } = req.body

        if (mail && password) {


            const result = await restaurant_model.findOne({ mail })


            if (result) {


                if (password == decryptText(result.password)) {

                    delete result._doc.password

                    result._doc.token = createToken(
                        result._doc._id,
                        false,
                        true,
                        false,
                    )
                    res.json(result._doc)

                } else {
                    res.status(400).json({
                        'message': 'invalid password'
                    })
                }


            } else {
                res.status(400).json({
                    'message': 'email not exist'
                })
            }

        } else {
            res.sendStatus(500)
        }

    } catch (e) {
        res.sendStatus(500)
    }

})



// login
router.post('/login', async (req, res) => {

    try {
        const { lang, idToken, fcmToken } = req.body

        if (idToken) {


            const firebaseUser = await firebaseAdmin.auth().verifyIdToken(idToken)

            if (firebaseUser) {

                const result = await user_model.findOneAndUpdate({ uid: firebaseUser.uid }, { fcmToken })

                if (result) {

                    delete result._doc.updatedAt
                    delete result._doc.createdAt
                    delete result._doc.uid

                    result._doc.token = createToken(result._doc._id, false, false, false)

                    if (req.body.tempUID) {
                        order_model.updateMany({
                            'userId': req.body.tempUID
                        },
                            { 'userId': result._id }
                        ).exec()
                        rating_model.updateMany({
                            'userId': req.body.tempUID
                        },
                            { 'userId': result._id }
                        )
                    }

                    res.json(
                        result
                    )

                } else {
                    res.status(400).json({
                        'message': lang == 'ar' ? 'هذا الحساب ليس مسجلاً لدينا' : 'This Account Not Exist'
                    })
                }

            } else {
                res.status(400).json({
                    'message': lang == 'ar' ? 'البريد الالكتروني او كلمة السر ليس صحيحا' : 'Email Or Password Invalid'
                })
            }

        } else {

            res.sendStatus(400)
        }
    } catch (e) {
        res.sendStatus(500)
    }

})

router.post('/anonymousLogin', async (req, res) => {

    try {
        const { uid } = req.body

        if (uid) {

            res.json({
                'token': createToken(
                    uid,
                    false,
                    false,
                    false
                )
            })
        }
        else
            res.sendStatus(400)
    } catch (e) {
        console.log(e)
        res.sendStatus(500)
    }
})
// register
router.post('/register', async (req, res) => {

    try {
        const { lang, idToken, name, email, notification, fcmToken } = req.body

        if (name, email && idToken) {

            const firebaseUser = await firebaseAdmin.auth().verifyIdToken(idToken)

            if (firebaseUser) {

                const userModel = new user_model({
                    provider: 'email',
                    name,
                    uid: firebaseUser.uid,
                    email: email,
                    fcmToken,
                    notification: notification ?? true

                })

                const result = await userModel.save()

                delete result._doc.updatedAt
                delete result._doc.createdAt
                delete result._doc.uid

                result._doc.token = createToken(result._doc._id, false, false, false)

                res.json(
                    result
                )
            } else {

                res.status(400).json({
                    'message': lang == 'ar' ? 'البريد الالكتروني ليس مسجلا لدينا' : 'Email is not Registed'
                })
            }
        } else {
            res.status(400)
        }
    } catch (e) {
        res.sendStatus(500)
    }
})


// soical
router.post('/social', async (req, res) => {
    try {
        const { lang, idToken, fcmToken } = req.body

        if (idToken) {


            const firebaseUser = await firebaseAdmin.auth().verifyIdToken(idToken)

            const provider = firebaseUser.firebase.sign_in_provider

            if (firebaseUser) {

                const result = await user_model.findOneAndUpdate({ uid: firebaseUser.uid, provider }, { fcmToken })

                if (result) {

                    delete result._doc.updatedAt
                    delete result._doc.createdAt
                    delete result._doc.uid

                    result._doc.token = createToken(result._doc._id, false, false, false)

                    res.json(
                        result
                    )

                } else {

                    const userModel = new user_model({
                        uid: firebaseUser.uid ?? '',
                        name: firebaseUser.name ?? '',
                        email: firebaseUser.email ?? '',
                        image: firebaseUser.picture ?? '',
                        phoneNumber: firebaseUser.phone_number ?? '',
                        provider,
                        fcmToken,
                    })
                    const result = await userModel.save()

                    delete result._doc.updatedAt
                    delete result._doc.createdAt
                    delete result._doc.uid

                    result._doc.token = createToken(result._doc._id, false, false, false)

                    res.json(
                        result
                    )
                }

            } else {
                res.status(400).json({
                    'message': lang == 'ar' ? 'البريد الالكتروني او كلمة السر ليس صحيحا' : 'Email Or Password Invalid'
                })
            }

        } else {

            res.sendStatus(400)
        }
    } catch (e) {
        res.sendStatus(500)
    }

})
module.exports = router