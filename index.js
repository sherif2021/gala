

const express = require('express')
const http = require('http')
const WebSocket = require('ws');
const app = express()
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


const mongoose = require('mongoose')
const firebaseAdmin = require("firebase-admin");
const serviceAccount = require(__dirname + "/serviceAccountKey.json");

const jwt = require("jsonwebtoken")
const real_time = require('./real_time');
const { use } = require('./routes/delivery_panel');

require("dotenv").config();


mongoose.connect(process.env.MONGODB_URI,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('Database Connected')
        test()
    }).catch((e) => {
        console.error(e)
    });



firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount)
});


app.use(require('cors')())
app.use(express.static(__dirname + '/public'))


app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use('/api/', (req, res, next) => {

    if (process.env.API_KEY == req.headers.key) next()
    else
        res.sendStatus(500)
})

app.use('/api/categories', require('./routes/categories'));
app.use('/api/deliverers', require('./routes/deliverers'));

app.use('/api/users', require('./routes/users'));
app.use('/api/foods', require('./routes/foods'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/restaurants', require('./routes/restaurants'));

app.use('/api/restaurantPanel', require('./routes/restaurant_panel'));
app.use('/api/adminPanel', require('./routes/admin_panel'));
app.use('/api/deliveryPanel', require('./routes/delivery_panel'));

server.listen(process.env.PORT || 4444, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});


const ping = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
        ws.ping();
    });
}, 3000);
ping


wss.on('connection', function connection(client, req) {


    const query = require('url').parse(req.url, true)['query'];


    var key = ''
    var token = ''


    for (const property in query) {

        if (property == 'key') {
            key = query[property]
        }
        if (property == 'token') {
            token = query[property]
        }
    }

    if (process.env.API_KEY == key && token) {


        jwt.verify(token, process.env.JWT_KEY, (err, user) => {
            if (err) client.close()

            else {

                client.id = user.id
                if (user.isAdmin) {

                    if (real_time.admins.has(user.id)) {
                        real_time.admins.get(user.id).close()
                        real_time.admins.delete(use.id)
                    }

                    client.send('connected')

                    real_time.admins.set(user.id, client)

                    client.onmessage = (message) => { }

                    client.onclose = () => {
                        client.close()
                        real_time.admins.delete(user.id)
                    }

                    client.onerror = () => {
                        client.close()
                        real_time.admins.delete(user.id)
                    }
                    console.log('Admin connectd ' + user.id)
                    real_time.sendAdminState(client)

                } else if (user.isRestaurant) {

                    if (real_time.restaurants.has(user.id)) {
                        real_time.restaurants.delete(use.id)
                    }

                    client.send('connected')

                    real_time.restaurants.set(user.id, client)

                    client.onmessage = (message) => { }

                    client.onclose = () => {
                        client.close()
                        real_time.restaurants.delete(user.id)
                    }

                    client.onerror = () => {
                        client.close()
                        real_time.restaurants.delete(user.id)
                    }
                    console.log('Rest connectd ' + user.id)
                    real_time.sendRestState(client)

                }
                else if (user.isDelivery) {

                    if (real_time.deliverers.has(user.id)) {
                        real_time.deliverers.get(user.id).close()
                        real_time.deliverers.delete(use.id)
                    }

                    real_time.deliverers.set(user.id, client)
                    real_time.sendDeliveryState(client)

                    client.send('connected')

                    client.onmessage = (message) => {
                        real_time.onDeliveryMessage(client, message.data)
                    }

                    client.onclose = () => {
                        client.close()
                        real_time.deliverers.delete(user.id)
                    }

                    client.onerror = () => {
                        client.close()
                        real_time.deliverers.delete(user.id)
                    }

                    console.log('delivery connectd ' + user.id)

                }
                else {

                    if (real_time.users.has(user.id)) {
                        real_time.users.get(user.id).close()
                        real_time.users.delete(use.id)
                    }

                    client.send('connected')
                    real_time.users.set(user.id, client)

                    client.onmessage = (message) => {

                    }

                    client.onclose = () => {
                        client.close()
                        real_time.users.delete(user.id)
                    }

                    client.onerror = () => {
                        client.close()
                        real_time.users.delete(user.id)
                    }
                    console.log('user connectd ' + user.id)
                }
            }
        })

    } else {
        client.close()
    }
});


async function test() {



    /*const order = order_model.updateMany({
    }, {
        delivery: true,
        deliveryId: ''
    })*/
}