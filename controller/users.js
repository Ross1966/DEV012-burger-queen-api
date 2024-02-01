// const users = require('../routes/users');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
// const { adminEmail } = require('../config');
const { connect } = require('../connect');


module.exports = {
// CONSULTA DE USUARIOS
  getUsers: async (req, resp, next) => {
    // TODO: Implement the necessary function to fetch the `users` collection or table
    try {
      const db = await connect();
      const collection = db.collection('user');
      // Obtenemos todos los usuarios de la Base de Datos
      const usersBd = await collection.find().toArray(); // muestra todo user sin condiciones
      // Aqui mostrará el listado de usuarios sin password;
      const users = usersBd.map((user) => ({
        "id": user._id,
        "email": user.email,
        "role": user.role
      }))

      resp.json(users);
    } catch (error) {
      next(401);
    }
  },
  // CREACION DE UN USUARIO
  createUser: async (req, resp, next) => {
    const { email, password, role } = req.body;

    // Validaciones
    if (!email || !password) {
      return resp.status(400).json({ error: 'Se necesita un email y un password' });
    }
    if (password.length < 6) {
      return resp.status(400).json({ error: 'Debe ser un password mínimo de 6 carácteres' });
    }
    const validaEmail = /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/;
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
        return resp.status(400).json({ error: 'El usuario ya existe' });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const newUser = { email, password: hashedPassword, role };

      // Insertar el nuevo usuario
      await user.insertOne(newUser);
      console.log('Se agregó un nuevo usuario');

      // Enviar respuesta
      resp.status(201).json({ email, role }); // No incluir la contraseña
    } catch (error) {
      console.error('Error al crear un nuevo usuario:', error);
      resp.status(500).json({ error: 'Error al crear un nuevo usuario' });
    }
  },

  // BORRAR UN USUARIO
  deleteUser: async (req, resp, next) => {
    try {
      const db = await connect();
      const user = db.collection('user');

      const userId = req.params.uid;
      const isObjectId = ObjectId.isValid(userId);
      console.log(isObjectId);

      let query;
      if (isObjectId) {
        query = { _id: new ObjectId(userId) };
      } else {
        query = { email: userId };
      }

      // Verifica si se encuentra el usuario antes de eliminarlo
      const userData = await user.findOne(query);
      console.log(userData); // Verifica si userData contiene al usuario correcto
      if (!userData){
        return resp.status(404).json({ error: 'El usuario solicitado no existe' });
      }


      const userDataId = userData._id;

      if (req.userId !== userDataId.toString()) {
        if (req.userRole !== 'admin') {
          console.log(req.userRole, 'en el body');
          return resp.status(403).json({ error: 'No tienes permiso para borrar el usuario' });
        }
      }
      // Elimina al usuario
      const userDelete = await user.deleteOne(query);

      resp.json({ userDelete, message: 'El usuario ha sido borrado, BIEN' });
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
      console.log(userData);

      if (!userData) {
        return resp.status(404).json({ error: 'El usuario solicitado no existe' });
      }

      const userDataId = userData._id;

      // Validar permisos para actualizar
      if (req.userId !== userDataId.toString()) {
        console.log(req.userId, 'del body');
        console.log(userDataId,'del token');
        if(req.userRole !== 'admin') {
          console.log(req.userRole, 'en el body');
          return resp.status(403).json({ error: 'No tienes permiso para actualizar este usuario' });
        }
      }


      const body = req.body;
      console.log(body.password);
      if (body.hasOwnProperty('password')) {
        const hashedPassword = bcrypt.hashSync(body.password, 10);
        body.password = hashedPassword;
      }
      console.log(body.password);

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
