const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const { connect } = require('../connect');
const { secret } = require('../config');

module.exports = {
  postOrders: async (req, resp) => {
    // resp.send("POST IMPLEMENTED");
    // console.log(req.body);
    const { userId, client, products, status } = req.body;

    if (!req.body || !userId || !client || !products || !status) {
      return resp.status(400).json({ error: 'no enought information' });
    }

    const statusValid = ['pending', 'canceled', 'delivering', 'delivered'];
    if (!statusValid.includes(status)) {
      return resp.status(400).json({ error: 'status is not valid' });
    }

    const { authorization } = req.headers;
    const [type, token] = authorization.split(' ');
    const decodedToken = jwt.verify(token, secret);
    // console.log("Toke info:", decodedToken);

    const userValid = decodedToken.uid;
    const loginRole = decodedToken.role
    // console.log("userValid:", userValid, "userId", userId);
    // console.log(userValid != userId, loginRole != 'admin');
    if (userValid != userId && loginRole != 'admin') {
      return resp.status(400).json({ error: 'login user and userId is not same or no admin' });
    }

    const addOrder = {
      userId,
      client,
      products,
      status,
      dateEntry: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };

    try {
      const db = await connect();
      const orderCollection = db.collection('order');

      const addOrderExists = await orderCollection.findOne({ client });

      if (!addOrderExists) {
        const result = await orderCollection.insertOne(addOrder);
        const getAddId = result.insertedId;
        const getAddOrder = await orderCollection.findOne({ _id: getAddId });

        resp.status(200).json(getAddOrder);
      } else {
        resp.status(403).json({ error: 'an order for that client already exists' });
      }
    } catch (error) {
      console.error(error);
    }
  },

  getOrders: async (req, resp) => {
    try {
      // console.log("GET IMPLEMENTED");
      const db = await connect();
      const collection = db.collection('orders');
      const ordersCollection = await collection.find().toArray();
      resp.status(200).json(ordersCollection);
    } catch (error) {
      resp.status(401);
    }
  },

  getOrdersId: async (req, resp) => {
    // resp.send("GET UID IMPLEMENTED");
    // console.log(req.params);
    try {
      const db = await connect();
      const orderCollection = db.collection('order');
      const { orderId } = req.params;
      // console.log(orderId);
      let orderFind = '';
      if (ObjectId.isValid(orderId)) {
        orderFind = await orderCollection.findOne({ _id: new ObjectId(orderId) });
      } else {
        orderFind = await orderCollection.findOne({ name: { $regex: orderId, $options: 'i' } });
      }
      if (!orderFind) {
        resp.status(404).json('order not found');
      } else {
        resp.status(200).json(orderFind);
      }
    } catch (error) {
      console.error(error);
      resp.status(404).send('order does not exist');
    }
  },

  putOrders: async (req, resp) => {
    // resp.send("PUT IMPLEMENTED");
    // console.log(req.params.orderId, req.body);
    try {
      const db = await connect();
      const orderCollection = db.collection('order');
      const { orderId } = req.params;
      let orderFind = '';

      if (!req.body) {
        return resp.status(400).json({ error: 'any information is provided' });
      }

      const { status } = req.body;
      if (!status) {
        return resp.status(400).json({ error: 'status is not provided' });
      }
      const statusValid = ['pending', 'canceled', 'preparing', 'delivering', 'delivered'];
      if (!statusValid.includes(status)) {
        return resp.status(400).json({ error: 'status is not valid' });
        // return resp.status(404).json({ error: 'status is not valid' });
      }

      const updateFields = {
        status,
        dateProcessed: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };

      if (ObjectId.isValid(orderId)) {
        orderFind = await orderCollection.findOneAndUpdate(
          { _id: new ObjectId(orderId) },
          { $set: updateFields },
          { returnDocument: 'after' }
        );

        resp.status(200).json(orderFind);
      } else {
        resp.status(404).json('order does not exist');
      }
    } catch (error) {
      resp.status(404).send('order does not exist');
    }
  },

  deleteOrders: async (req, resp) => {
    // resp.send("DELETE NOT IMPLEMENTED")
    // console.log(req.params);
    try {
      const db = await connect();
      const orderCollection = db.collection('order');
      const { orderId } = req.params;
      // console.log(orderId);
      let orderFind = '';
      if (ObjectId.isValid(orderId)) {
        orderFind = await orderCollection.findOneAndDelete({ _id: new ObjectId(orderId) });
      } else {
        orderFind = await orderCollection.findOneAndDelete({ name: { $regex: orderId, $options: 'i' } });
      }
      if (!orderFind) {
        resp.status(404).json('order not found');
      } else {
        resp.status(200).json(orderFind);
      }
    } catch (error) {
      console.error(error);
      resp.status(404).send('order does not exist');
    }
  },
};