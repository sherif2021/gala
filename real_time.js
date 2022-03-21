const order_model = require('./models/order_model')
const delivery_model = require('./models/delivery_model')
const restaurant_model = require('./models/restaurant_model');
const user_model = require('./models/user_model');
const { senNotification } = require('./helper')

const admins = new Map();
const restaurants = new Map();
const users = new Map();
const deliverers = new Map();

const sendRestData = (id, type, data,) => {

    if (restaurants.has(id)) {
        restaurants.get(id).send(
            JSON.stringify({ type, data })
        )
    }
    else {
        console.log('rest offline ' + id)
    }
}
const sendToAllRestData = (type, data,) => {

    restaurants.forEach(e => {
        e.send(JSON.stringify({ type, data }))
    })
}
const sendDeliveryData = (id, type, data,) => {

    if (deliverers.has(id)) {
        deliverers.get(id).send(
            JSON.stringify({ type, data })
        )
    }
    else {
        console.log('delivery offline ' + id)
    }
}
const sendAdminData = (id, type, data,) => {

    if (admins.has(id)) {
        admins.get(id).send(
            JSON.stringify({ type, data })
        )
    }
    else {
        console.log('admin offline ')
    }
}

const sendToAllDeliverers = (type, data) => {

    deliverers.forEach(e => {
        e.send(
            JSON.stringify({ type, data })
        )
    })
}
const sendToAdmins = (type, data) => {

    admins.forEach(e => {
        e.send(
            JSON.stringify({ type, data })
        )
    })
}
const sendUserData = (id, type, data,) => {

    if (users.has(id)) {
        users.get(id).send(
            JSON.stringify({ type, data })
        )
    }
    else {
        console.log('user offline ' + id)
    }
}

const onDeliveryMessage = async (client, data) => {


    try {
        const json = JSON.parse(data)

        switch (json.type) {
            case 'new_location':
                var late = json.data.late
                var long = json.data.long

                client.late = late
                client.long = long

                if (client.currentOrder != null && client.currentRest != null) {

                    sendRestData(
                        client.currentRest,
                        'delivery_state',
                        {
                            'id': client.id,
                            'late': late,
                            'long': long
                        }
                    )
                }
                // send datails to rest

                break
            case 'accept_order':

                if (client.currentOrder == null) {

                    order_model.findOneAndUpdate({ _id: json.data, accepted: true, cooked: true, picking: false },

                        {
                            deliveryId: client.id,
                            picking: true,
                            commission: client.commission
                        },
                        (err, order) => {

                            if (err) return

                            if (order) {

                                sendToAllDeliverers('remove_order', order._id)

                                // send status to client
                                // send status to rest
                                // send status to admin

                                client.currentOrder = order._id
                                client.currentRest = order.restId
                                client.currentUser = order.userId

                                sendRestData(
                                    order.restId,
                                    'order_delivery_accepted',
                                    {
                                        'delivery': client.id,
                                        'order': order._id,
                                    }
                                )

                                sendDeliveryData(
                                    client.id,
                                    'order_accepted',
                                    order,
                                )



                            } else {

                                sendDeliveryData(

                                    client.id,
                                    'order_not_available',
                                    {
                                        'number': order.orderNumber
                                    },
                                )
                            }
                        }
                    )
                }
                else {

                    sendDeliveryData(client.id, 'must_complete_current_order', '')
                }

                break
            case 'onDeliveryOnWay':

                sendDeliveryData(client.id, 'onDeliveryOnWayDone', '')

                order_model.updateOne({ _id: client.currentOrder }, { inTheWay: true }).exec()

                sendRestData(
                    client.currentRest,
                    'delivery_on_way',
                    {
                        'delivery': client.id,
                        'order': client.currentOrder,
                    }
                )
                sendToAdmins(
                    'delivery_on_way',
                    {
                        'delivery': client.id,
                        'order': client.currentOrder,
                    }
                )

                // send status to client


                break

            case 'onOrderCompleted':

                sendDeliveryData(client.id, 'onOrderCompletedDone', '')

                sendRestData(
                    client.currentRest,
                    'order_done',
                    {
                        'delivery': client.id,
                        'order': client.currentOrder,
                    }
                )

                sendToAdmins(
                    'order_done',
                    {
                        'delivery': client.id,
                        'order': client.currentOrder,
                    }
                )

                sendUserData(
                    client.currentUser,
                    'order_done',
                    client.currentOrder,
                )
                user_model.findById(client.currentUser).select('fcmToken').then(r => {
                    if (r && r.fcmToken) {
                        senNotification(r.fcmToken, 'تم تسليم الاوردر' , 'تم تسليم الاورد بنجاح')
                    }
                })
                //

                await order_model.updateOne({ _id: client.currentOrder }, { completed: true }).exec()

                client.currentOrder = null
                client.currentUser = null
                client.currentRest = null
                break

        }
    } catch (e) {
        console.log(e)
    }
}

function sendDeliveryState(client) {
    try {

        // get orders
        order_model.find({
            accepted: true,
            cooked: true,
            picking: false,
            inTheWay: false,
            completed: false,
            delivery: true,
            deliveryId: ''
        }, (err, result) => {
            if (!err && result)
                sendDeliveryData(client.id, 'orders', result)
        })


        // get rest
        restaurant_model.find({ 'active': true }, (err, result) => {
            if (!err && result)
                sendDeliveryData(client.id, 'rests', result)
        })


        // get state
        delivery_model.findOne({ _id: client.id }, (err, delivery) => {

            if (delivery) {

                delete delivery.password

                sendDeliveryData(client.id, 'info', delivery)
                client.commission = delivery.commission

            } else {
                // send account delete
            }

        })


        order_model.findOne({
            'deliveryId': client.id,
            'completed': false,
            'declined': false,
            'accepted': true,
            'cooked': true,
            'picking': true
        }, (err, result) => {
            if (err) return;
            if (result) {
                client.currentOrder = result._id
                client.currentUser = result.userId
                client.currentRest = result.restId

                sendDeliveryData(client.id, 'current_order', result)
            }

        })
        order_model.findOne({
            'deliveryId': client.id,
            'completed': false,
            'declined': false,
            'accepted': true,
            'cooked': true,
            'inTheWay': true
        }, (err, result) => {
            if (err) return;
            if (result) {
                client.currentOrder = result._id
                client.currentUser = result.userId
                client.currentRest = result.restId
                sendDeliveryData(client.id, 'current_order', result)
            }

        })


        // get prev orders
        order_model.find({
            'deliveryId': client.id,
            'completed': true,
        }, (err, result) => {
            if (err) return;
            if (result) {
                sendDeliveryData(client.id, 'previousOrders', result)
            }
        })

    } catch (e) {
        console.log(e)
    }
}

async function sendRestState(client) {

    try {

        const result = await order_model.where({ restId: client.id })

        if (result) {


            const userIds = []
            result.forEach(e => {
                if (e.userId.length == 24)
                    return e.userId
            })

            if (userIds.length > 0) {
                const users = await user_model.find({ _id: { $in: userIds } })


                result.forEach(e => {

                    users.forEach(e => {
                        if (e._id == result.userId) {
                            result.user_name = e.name
                            return;
                        }
                    })
                })

            }

            sendRestData(client.id, 'orders', result)

        }


    } catch (e) {
        console.log(e)
    }
}

async function sendAdminState(client) {
    try {
        const result = await order_model.where()

        if (result) {
            const userIds = []
            result.forEach(e => {
                if (e.userId.length == 24)
                    return e.userId
            })

            if (userIds.length > 0) {
                const users = await user_model.find({ _id: { $in: userIds } })


                result.forEach(e => {

                    users.forEach(e => {
                        if (e._id == result.userId) {
                            result.user_name = e.name
                            return;
                        }
                    })
                })

            }

            sendAdminData(client.id, 'orders', result)
        }

    } catch (e) {
        console.log(e)
    }
}
function caclDistance(lat1,
    lat2, lon1, lon2) {

    // The math module contains a function
    // named toRadians which converts from
    // degrees to radians.
    lon1 = lon1 * Math.PI / 180;
    lon2 = lon2 * Math.PI / 180;
    lat1 = lat1 * Math.PI / 180;
    lat2 = lat2 * Math.PI / 180;

    // Haversine formula
    let dlon = lon2 - lon1;
    let dlat = lat2 - lat1;
    let a = Math.pow(Math.sin(dlat / 2), 2)
        + Math.cos(lat1) * Math.cos(lat2)
        * Math.pow(Math.sin(dlon / 2), 2);

    let c = 2 * Math.asin(Math.sqrt(a));

    // Radius of earth in kilometers. Use 3956
    // for miles
    let r = 6371;

    // calculate the result
    return (c * r);
}

module.exports = {
    admins,
    restaurants,
    users,
    deliverers,
    onDeliveryMessage,
    sendRestData,
    sendUserData,
    sendDeliveryData,
    sendDeliveryState,
    sendRestState,
    sendToAllDeliverers,
    sendToAdmins,
    sendAdminState,
    sendToAllRestData,
}