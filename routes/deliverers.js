const router = require('express').Router()
const delivery_model = require('../models/delivery_model')


// get all deliverers
router.get('/', async (req, res) => {

    try {
        const result = await delivery_model.find({ 'accepted': true })

        result.forEach(e => {
            delete e._doc.password
        })
        res.json(result)
    } catch (e) {

        res.sendStatus(500)
    }
})

module.exports = router