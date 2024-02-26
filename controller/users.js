// const users = require('../routes/users');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const { connect } = require('../connect');
const { json } = require('body-parser');

// const db = connect();



module.exports = {
// CONSULTA DE USUARIOS
  getUsers: async (req, resp, next) => {
    try {
      const db = await connect();
      const user = db.collection('user');
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query._limit) || 10;

      const totalUsers = await user.countDocuments();
      const startIndex = (page - 1) * limit;

      const users = await user.find({}, { projection:
         { password: 0 } }).skip(startIndex).limit(limit).toArray();

      const consultUsers = {
        totalItems: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page,
        limit: limit,
        users: users, // Incluir la información de los usuarios en la respuesta
      };

      resp.status(200).json(users);
    } catch (error) {
      console.error(error);
      resp.status(500).json({ error: 'Error al obtener la lista de usuarios' });
    }
},


  getUsersUid: async (req, resp) => {
    try {
      const db = await connect();
      const user = db.collection('user');

      const userId = req.params.uid;
      const isObjectId = ObjectId.isValid(userId);

      let query;
      if (isObjectId) {
        query = { _id: new ObjectId(userId) };
      } else {
        query = { email: userId }
      }

      const userData = await user.findOne(query);
      // console.log(userData);

      if (!userData) {
        return resp.status(404).json({ error: 'el ususario solicitado no existe' });
      }
      const userDataId = userData._id;

      if (req.userRole !== 'admin') {
        if (req.userId !== userDataId.toString()) {
          return resp.status(403).json({ error: 'No tienes permiso' });
        }
      }

      delete userData.password;
      resp.json(userData);
    } catch (error) {
      console.error(error);
      resp.status(500).json({ error: 'Error al obtener el usuario' });
    }
  },

  // CREACION DE UN USUARIO
  postUsers: async (req, resp) => {
    const { email, password, role } = req.body;
    // console.log(req.body);

    // Validaciones
    // db.user.createIndex({ email: 1 }, { unique: true });
    if (!email || !password) {
      return resp.status(400).json({ error: 'Se necesita un email y un password' });
    }

    const validaEmail = /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/;

    // const validaEmail = /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,}$/gm;
    if (!validaEmail.test(email)) {
      return resp.status(400).json({ error: 'Debe ser un email válido' });
    }
    if (!(role === 'admin' || role === 'waiter' || role === 'chef')) {
      return resp.status(400).json({ error: 'Debe contener un rol válido' });
    }

    try {
      const db = await connect();
      const user = db.collection('user');

    // Verificar si el usuario ya existe tomando en cuenta si está escrito con mayúsculas o minúsculas
      const existeUser = await user.findOne({ email: email.toLowerCase() });

      if (existeUser) {
        return resp.status(403).json({ error: 'El usuario ya existe' });
}

      const hashedPassword = bcrypt.hashSync(password, 10);
      // const newUser = { email, password: hashedPassword, role };
      const newUser = { email: email.toLowerCase(), password: hashedPassword, role };

      // Insertar el nuevo usuario
      const response = await user.insertOne(newUser);
      const _id = response.insertedId;
      // console.info(newUser);
      console.info('-----Se agregó un nuevo usuario');

      // Enviar respuesta
      // delete newUser.password;
      // resp.status(200).json(newUser);
      resp.status(201).json({ email, role, _id }); // No incluir la contraseña
    } catch (error) {
      console.error('Error al crear un nuevo usuario:', error);
      resp.status(500).json({ error: 'Error al crear un nuevo usuario' });
    }
  },

  // BORRAR UN USUARIO
  deleteUsers: async (req, resp, next) => {
    try {
      const db = await connect();
      const user = db.collection('user');

      const userId = req.params.uid;
      const isObjectId = ObjectId.isValid(userId);
      // console.info(userId);

      let query;
      if (isObjectId) {
        query = { _id: new ObjectId(userId) };
      } else {
        query = { email: userId };
      }

      // Verifica si se encuentra el usuario antes de eliminarlo
      const userData = await user.findOne(query);
      // console.log(userData); // Verifica si userData contiene al usuario correcto
      if (!userData) {
        return resp.status(404).json({ error: 'El usuario solicitado no existe' });
      }


      const userDataId = userData._id;

      if (req.userId !== userDataId.toString()) {
        if (req.userRole !== 'admin') {
          // console.log(req.userRole, 'en el body');
          return resp.status(403).json({ error: 'No tienes permiso para borrar el usuario' });
        }
      }
      // Elimina al usuario
      const deletedUser = await user.deleteOne(query);

      return resp.status(200).json({ deletedUser, message: 'El usuario ha sido borrado, BIEN' });
    } catch (error) {
      console.error(error);
      return next(500);
    }
  },
  // MODIFICAR UN USUARIO
  putUsers: async (req, resp, next) => {
    try {
      const db = await connect();
      const user = db.collection('user');
      // const userExist = await user.findOne({ email });

      const userId = req.params.uid;
      const isObjectId = ObjectId.isValid(userId);

      let query;
      if (isObjectId) {
        query = { _id: new ObjectId(userId) };
      } else {
        query = { email: userId };
      }

      const userData = await user.findOne(query);
      // console.log(userData);

      if (!userData) {
        return resp.status(404).json({ error: 'El usuario solicitado no existe' });
      }

      const userDataId = userData._id;

      // Validar permisos para actualizar
      if (req.userId !== userDataId.toString()) {
        // console.log(req.userId, 'del body');
        // console.log(userDataId, 'del token');
        if (req.userRole !== 'admin') {
          // console.log(req.userRole, 'en el body');
          return resp.status(403).json({ error: 'No tienes permiso para actualizar este usuario' });
        }
      }
      // Aqui modifiqué
      const body = await req.body;
      // console.log(body.password);
      if (body.hasOwnProperty('password')) {
        const hashedPassword = bcrypt.hashSync(body.password, 10);
        body.password = hashedPassword;
      }
      // console.log(body.password);

      if (!body || Object.keys(body).length === 0) {
        return resp.status(400).json({ error: 'Debe haber al menos una propiedad para actualizar' });
      }

      if (req.userRole !== 'admin' && body.hasOwnProperty('role')) {
        return resp.status(403).json({ error: 'No tienes permiso para actualizar tu role' });
      }

      const userUpdate = await user.updateOne(query, { $set: body });

      resp.json({ userUpdate, message: 'El usuario ha sido actualizado correctamente' });
    } catch (error) {
      console.error(error);
      resp.status(500).json({ error: 'Error al crear un nuevo usuario' });
      console.error(error);
      return next(500);
    }
  },

};
