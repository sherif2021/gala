const router = require('express').Router()
const user_model = require('../models/user_model')

const { createToken, verifyToken } = require('../helper')



router.get('/byToken/:token', verifyToken, async (req, res) => {

    try {

        const result = await user_model.findById(req.user.id)
        if (result) {
            res.json(result)
        }
        else {
            res.sendStatus(404)
        }
    } catch (e) {
        res.sendStatus(500)
    }

})
router.post('/update', verifyToken, async (req, res) => {
    try {

        const result = await user_model.findByIdAndUpdate(req.user.id, req.body)
        if (result) {
            res.json(result)
        }
        else {
            res.sendStatus(404)
        }
    } catch (e) {
        res.sendStatus(500)
    }

})

router.get('/:id', async (req, res) => {

    try {

        const result = await user_model.findById(req.params.id)

        res.json(result)
    } catch (e) {
        res.sendStatus(500)
    }

})

module.exports = router