// const users = require("../routes/users");
const { adminEmail } = require("../config");
const { connect } = require("../connect");
const bcrypt = require('bcrypt');

module.exports = {
  getUsers: async (req, resp, next) => {
    // TODO: Implement the necessary function to fetch the `users` collection or table
    try {
      const db = await connect();
      const collection = db.collection('user');
      // Obtenemos todos los usuarios de la Base de Datos
      const usersBd = await collection.find().toArray(); //muestra todo user sin condiciones
      console.log('Usuarios en la Base de Datos: ', usersBd);

      resp.json(usersBd) //establece explícitamente el encabezado Content-Type de la respuesta como application/json. 
    } catch (error) {
      next(401)
    }
  },



  createUser: async (req, resp, next) => {
    const { email, password, role } = req.body;
// Si no existe usuario, password o rol
    if (!email || !password || !role) {
      console.log("No hay usuario o password")
      return next(400);
    }

    const newUser = {
      email: email,
      password: bcrypt.hashSync(password, 10),
      role: role,
    };

    try {
      const db = await connect();
      const usersCollection = db.collection('user');

      const addUserExists = await usersCollection.findOne({ email: email });

      if (!addUserExists) {
        const buscar = await usersCollection.insertOne(newUser);

        console.log(buscar);
        const getAddId = buscar.insertedId;
        const getAddUser = await usersCollection.findOne({ _id: getAddId });
        resp.send({
          "id": getAddId, //addUser._id,
          "email": getAddUser.email,//addUser.email,
          "role": getAddUser.role//addUser.role,
        })
        console.log('Usuario Creado');
      } else {
        console.log('El correo ya esta registrado: ', addUserExists);
        next(403)
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      next(500);
    }
  },

};
