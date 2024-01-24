const jwt = require('jsonwebtoken');
const config = require('../config');
const { connect } = require('../connect');

const { secret } = config;

module.exports = (app, nextMain) => {
  app.post('/login', async (req, resp, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(400);
    }

    // TODO: Authenticate the user
    try {
      const db = await connect();
      const collection = db.collection('user'); // It is necessary to confirm if the email and password match a user in the database
      const userValid = await collection.findOne({ email });
      //console.log("Login del usuario: ", userValid)
      if (!userValid) {
        return next(401);
      }
     const authPassword = password === userValid.password   //await bcrypt.compare(password, userValid.password);
      console.log("Password Valido? "+authPassword)
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
          }
 );
        console.log("Token creado: "+tokenIs);
        resp.json({ token: tokenIs });
      } else {
        next(400);
      }
    } catch (error) {
      console.error("Error");
    }
  });

  return nextMain();
};