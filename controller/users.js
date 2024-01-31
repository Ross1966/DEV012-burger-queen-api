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

      resp.json(usersBd) // establece explícitamente el encabezado Content-Type de la respuesta como application/json. 
    } catch (error) {
      next(401)
    }
  },

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

      // Verificar si el usuario ya existe
      const existeUser = await user.findOne({ email });
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
  }
};



