const { ObjectId } = require('mongodb');
const { connect } = require('../connect');

// const db = await connect();

module.exports = {
// CREACION DE UN PRODUCTO
  postProducts: async (req, resp, next) => {
    const { name, price, image, type, dateEntry} = req.body;
    const newProduct = {
      name,
      price,
      image,
      type,
      dateEntry,
    };

    try {
      const db = await connect();
      const products = db.collection('product');
      // validar si el producto existe
      const productExist = await products.findOne({ name });
      if (productExist) {
        return resp.status(403).json({ error: 'ya existe el producto' });
      }

      if (!name || !price) {
        return resp.status(400).json({ error: 'Tienes que ingresar todos los datos' });
      }

      await products.insertOne(newProduct);
      resp.status(200).json(newProduct);
    } catch (error) {
      return next(500);
    }
  },

  // VISUALIZAR UN PRODUCTO
  getProducts: async (req, resp) => {
    try {
      const db = await connect();
      const products = db.collection('product');

      // Obtener todos los usuarios de la colección
      const productsAll = await products.find({}).toArray();

      resp.json(productsAll);
} catch (error) {
      console.error(error);
      resp.status(500).json({ error: 'Error al obtener la lista de Productos' });
    }
  },

  // VISUALIZAR LOS PRODUCTOS POR ID

  getProductsId: async (req, resp) => {
    // resp.send('GET one product by id IMPLEMENTED')
    // console.log(req.params);
     console.log(req.params);
    try {
      const db = await connect();
      const productCollection = db.collection('product');
      const { productId } = req.params;
      console.log(productId);
      // console.log(productId);
      let productFind = '';
      if (ObjectId.isValid(productId)) {
        productFind = await productCollection.findOne({ _id: new ObjectId(productId) });
      } else {
        productFind = await productCollection.findOne({ name: { $regex: productId, $options: 'i' } });
      }
      if (!productFind) {
        resp.status(404).json('Producto no válido');
      } else {
        resp.status(200).json(productFind);
      }
    } catch (error) {
      console.error(error);
      resp.status(404).send('El producto no existe');
    }
  },

  // MODIFICACION DE UN PRODUCTO

  putProducts: async (req, resp) => {
    // resp.send("PUT IMPLEMENTED");
    // console.log(req.params.productId, req.body);
    try {
      const db = await connect();
      const productCollection = db.collection('product');
      const { productId } = req.params;
      let productFind = '';

      if (!req.body) {
        return resp.status(400).json({ error: 'any information is provided' });
      }

      if (req.body.status) {
        const statusValid = ['pending', 'canceled', 'preparing', 'delivering', 'delivered'];
        if (!statusValid.includes(req.body.status)) {
          return resp.status(400).json({ error: 'status is not valid' });
          // return resp.status(404).json({ error: 'status is not valid' });
        }
      }

      if (req.body.price) {
        // console.log(typeof req.body.price != 'number');
        if (typeof req.body.price != 'number') {
          return resp.status(400).json({ error: 'price is not valid' });
        }
      }

      const updateFields = {
        ...req.body, // operador 'spread' para traer todos los campos de req.body
        dateProcessed: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };
      /* req.body.dateProcessed = new Date().toISOString().slice(0, 19).replace('T', ' ')
      const updateFields = req.body */

      if (ObjectId.isValid(productId)) {
        productFind = await productCollection.findOneAndUpdate(
          { _id: new ObjectId(productId) },
          { $set: updateFields },
          { returnDocument: 'after' }
        );
        resp.status(200).json(productFind);
      } else {
        resp.status(404).json('Producto no encontrado');
      }
    } catch (error) {
      resp.status(404).send('El producto no existe');
    }
  },

  // BORRADO DE UN PRODUCTO

  deleteProducts: async (req, resp) => {
    try {
      const db = await connect();
      const productCollection = db.collection('product');
      const { productId } = req.params;
      // console.log(productId);
      let productFind = '';
      if (ObjectId.isValid(productId)) {
        productFind = await productCollection.findOneAndDelete({ _id: new ObjectId(productId) });
      } else {
        productFind = await productCollection.findOneAndDelete({ name: { $regex: productId, $options: 'i' } });
      }
      if (!productFind) {
        resp.status(404).json('Producto no encontrado');
      } else {
        resp.status(200).json(productFind);
      }
    } catch (error) {
      console.error(error);
      resp.status(404).send('El producto no existe');
    }
  },
};