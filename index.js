const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const stripe = require("stripe")('sk_test_51L1X0aJ4uo6umqFGlX4zF8WfRrJoNPFilrmroV5SP8WZ6r4scj2JQXaRooHcdaClMnQS1G0BBNFEVs03i0XDVB9b00lZesQk98');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3i1k8kk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// jwt
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}

// api
async function run() {
    try {
        await client.connect();
        const usersCollection = client.db('Ed-Tech').collection('users');
        const courseCollection = client.db('Ed-Tech').collection('courses');

        // PAYMENTS
        // app.post('/create-payment-intent', async (req, res) => {
        //     const service = req.body;
        //     const price = service.price;
        //     const amount = price * 100;
        //     const paymentIntent = await stripe.paymentIntents.create({
        //         amount: amount,
        //         currency: 'usd',
        //         payment_method_types: ['card']
        //     });
        //     res.send({ clientSecret: paymentIntent.client_secret })
        // });

        // update users
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
        });

        // get course
        app.get('/courses', async (req, res) => {
            const courses = await courseCollection.find().toArray();
            res.send(courses);
        });

        // get course by id
        app.get('/course/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const course = await courseCollection.findOne(query);
            res.send(course);
        })
    }
    finally { }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})