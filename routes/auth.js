const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config');
const { connect } = require('../connect');


const { secret } = config;

module.exports = (app, nextMain) => {
  app.post('/login', async (req, resp, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(401);
    }

    // TODO: Authenticate the user
    try {
      const db = await connect();
      // It is necessary to confirm if the email and password match a user in the database
      const collection = db.collection('user');
      const userValid = await collection.findOne({ email });

      console.log("Login del usuario: ", userValid);
      if (!userValid) {
        return next(400);
      }

      const authPassword = await bcrypt.compare(password, userValid.password);
      console.log('Password Valido? '+ authPassword);

// If they match, send an access token created with JWT
      if (authPassword) {
        const tokenIs = jwt.sign(
          {
            uid: userValid._id,
            email: userValid.email,
            role: userValid.role,
          },
          secret,
          {
            expiresIn: '1h',
          },
        );
        console.log(tokenIs);
        resp.json({ token: tokenIs });
      } else {
        next(400);
      }
    } catch (error) {
      console.error('Error', error);
      next(500);
    }
  });

  return nextMain()
};