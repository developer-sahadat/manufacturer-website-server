const express = require("express");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
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
    /**My order  Delete  api code start**/
    app.delete("/my-order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
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
