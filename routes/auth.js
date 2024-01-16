const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config');
const { connect } = require('../connect');

const { secret } = config;

module.exports = (app, nextMain) => {
  app.post('/login', (req, resp, next) => {
    app.post('/login', async (req, resp, next) => {
      const { email, password } = req.body;
    console.log("Request")
      if (!email || !password) {
        return next(400);
      }
      // TODO: Authenticate the user
      // It is necessary to confirm if the email and password
      // match a user in the database
      // If they match, send an access token created with JWT

      try {
        const db = await connect();
        const collection = db.collection('user');
        const userValid = await collection.findOne({ email });
        if (!userValid) {
          return next(401);
        }
        const authPassword = await bcrypt.compare(password, userValid.password);
        if (authPassword) {
          const tokenIs = jwt.sign({ uid: userValid._id, email: userValid.email, role: userValid.roles }, secret, { expiresIn: '1h' });
        console.log(tokenIs);
          resp.json({ token: tokenIs });
        }

        next();

        return nextMain();
      } catch (error) {
        console.error("Error");
      }

      return nextMain();
    });
  });
};
