const express = require("express");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.ys4hh.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

/*****Verify Web Token start code*****/
function verifyJWT(req, res, next) {
  const authHeaderToken = req.headers.authorization;
  if (!authHeaderToken) {
    return res.status(401).send({ message: "UnAuthorization Access" });
  }
  const token = authHeaderToken.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}
/*****Verify Web Token ends code*****/

/*****Express js mongodb crud operations start code*****/
async function run() {
  try {
    await client.connect();
    /**MongoDb all collection code**/
    const servicesCollection = client
      .db("construction_tools")
      .collection("services");
    const orderCollection = client.db("construction_tools").collection("order");
    const userCollection = client.db("construction_tools").collection("user");
    const reviewCollection = client
      .db("construction_tools")
      .collection("review");
    const offerCollection = client.db("construction_tools").collection("offer");

    /**User  put update api code start**/
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      var token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN);
      res.send({ result, token });
    });

    /**User get find api code start**/
    app.get("/user", verifyJWT, async (req, res) => {
      const user = await userCollection.find({}).toArray();
      res.send(user);
    });
    /**User get findOne api code start**/
    app.get("/single-user", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const user = await userCollection.findOne({ email: email });
      res.send(user);
    });

    /**Make  user a Admin put api code start**/
    app.put("/user/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requestor = req.decoded.email;
      const requestorInfo = await userCollection.findOne({ email: requestor });

      if (requestorInfo?.role === "admin") {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: "admin" },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      } else {
        return res.status(403).send({ message: "Forbidden Access" });
      }
    });

    /** Admin get api code start**/
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const admin = await userCollection.findOne({ email: email });
      const isAdmin = admin.role === "admin";
      res.send({ admin: isAdmin });
    });

    /** profile update  api code start**/
    app.put("/profile/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };

      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc);

      res.send(result);
    });

    /**all  services get find api code start**/
    app.get("/services", async (req, res) => {
      const services = await servicesCollection.find({}).toArray();
      res.send(services);
    });

    /**services get findOne api code start**/
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await servicesCollection.findOne(query);
      res.send(service);
    });

    /**all  services get find api code start**/
    app.post("/services", async (req, res) => {
      const service = req.body;
      const doc = service;
      const result = await servicesCollection.insertOne(doc);
      res.send(result);
    });

    /**services get findOne api code start**/
    app.delete("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await servicesCollection.deleteOne(query);
      res.send(result);
    });

    /**order  post insert api code start**/
    app.post("/order", async (req, res) => {
      const order = req.body;
      const doc = order;
      const result = await orderCollection.insertOne(doc);
      res.send(result);
    });

    /**My order  get find api code start**/
    app.get("/my-order", verifyJWT, async (req, res) => {
      const email = req?.query?.email;
      const decodedEmail = req.decoded.email;
      if (decodedEmail === email) {
        const query = { email };
        const service = await orderCollection.find(query).toArray();
        res.send(service);
      } else {
        return res.status(403).send({ message: "Forbidden Access" });
      }
    });

    /**my order payment page id filter get findOne api**/
    app.get("/my-order/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.findOne(query);
      res.send(result);
    });

    /**my order payment page id filter get findOne api**/
    app.put("/my-order/:id", async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };

      const updateDoc = {
        $set: {
          paid: true,
          transaction: payment.transaction,
        },
      };
      const result = await orderCollection.updateOne(filter, updateDoc);

      res.send(result);
    });

    /**My order  Delete  api code start**/
    app.delete("/my-order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    /**My order  all get  api code start**/
    app.get("/order", verifyJWT, async (req, res) => {
      const review = await orderCollection.find({}).toArray();
      res.send(review);
    });
    /**My order  all get  api code start**/
    app.put("/order/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const shipped = req.body;
      const updateDoc = {
        $set: shipped,
      };
      const result = await orderCollection.updateOne(filter, updateDoc);

      res.send(result);
    });

    /**Create a PaymentIntent with the order amount API**/
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    /**user Review posh API code start **/
    app.post("/review", async (req, res) => {
      const review = req.body;
      const doc = review;
      const result = await reviewCollection.insertOne(doc);
      res.send(result);
    });

    /**user Review get API code start **/
    app.get("/review", async (req, res) => {
      const review = await reviewCollection.find({}).toArray();
      res.send(review);
    });
    /**user Offer get API code start **/
    app.get("/offer", async (req, res) => {
      const offer = await offerCollection.find({}).toArray();
      res.send(offer);
    });
  } finally {
  }
}

run().catch(console.dir);

/*****Express js mongodb crud operations end code*****/

app.get("/", (req, res) => {
  res.send("Hello Express Js");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
