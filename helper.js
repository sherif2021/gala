const firebaseAdmin = require('firebase-admin')
const CryptoJS = require("crypto-js")
const jwt = require("jsonwebtoken")

const encryptText = (text) => {
    return CryptoJS.AES.encrypt(text, process.env.CRYPTO_KEY).toString()
};

const decryptText = (text) => {
    return CryptoJS.AES.decrypt(text, process.env.CRYPTO_KEY).toString(CryptoJS.enc.Utf8)
};

const createToken = (id, isAdmin, isRestaurant, isDelivery) => {

    return jwt.sign(
        {
            id,
            isAdmin,
            isRestaurant,
            isDelivery,
        },
        process.env.JWT_KEY,
    )
}

const verifyToken = (req, res, next) => {

    const token = req.headers.token
    if (token) {
        jwt.verify(token, process.env.JWT_KEY, (err, user) => {
            if (err) return res.sendStatus(401)
            req.user = user
            next()
        })
    } else {
        return res.status(401)

    }
}

const verifyTokenAndAuthorization = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.id === req.params.id || req.user.isAdmin) {
            next()
        } else {
            return res.sendStatus(401)
        }
    })
}

const verifyTokenAndAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.isAdmin) {
            next()
        } else {
            return res.sendStatus(401)
        }
    })
}

const verifyTokenAndRestaurant = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.isRestaurant) {
            next()
        } else {
            return res.sendStatus(401)
        }
    })
}

const verifyTokenAndDelivery = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.isDelivery) {
            next()
        } else {
            return res.sendStatus(401)
        }
    })
}
const senNotification = function (fcmToken, title, body) {

    if (fcmToken && title && body) {
        const payload = {
            "token": fcmToken,
            "notification": {
                "title": title,
                "body": body,
            },
            data: {
                "click_action": "FLUTTER_NOTIFICATION_CLICK",
            }
        }
        firebaseAdmin.messaging().send(payload)
            .then((response) => {
                console.log(response)

            })
            .catch((error) => {

                console.log(error)
            });
    }
}
const sendNotificationToAll = async function (title, body) {

    try {
        if (title && body) {

            const payload = {
                "topic": 'all',
                "notification": {
                    "title": title,
                    "body": body,
                },
                data: {
                    "click_action": "FLUTTER_NOTIFICATION_CLICK",
                }
            }
            await firebaseAdmin.messaging().send(payload)
            return true
        }
    } catch (e) {
        console.log(e)
        return false
    }
}
module.exports = {
    encryptText, decryptText, createToken, verifyToken, senNotification,
    verifyTokenAndAuthorization,
    verifyTokenAndAdmin,
    verifyTokenAndRestaurant,
    verifyTokenAndDelivery,
    sendNotificationToAll
}