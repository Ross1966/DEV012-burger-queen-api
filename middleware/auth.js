const jwt = require('jsonwebtoken');
const { secret } = require('../config');

module.exports = (secret) => (req, resp, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return next();
  }

  const [type, token] = authorization.split(' ');
  // console.log('Hola' + token);
  if (type.toLowerCase() !== 'bearer') {
    return next();
  }

  jwt.verify(token, secret, (err, decodedToken) => {
  

if (err) {
      return next(403);
    }
    req.userId = decodedToken.uid;
    console.log(req.userId);
    req.userRole = decodedToken.role;
    console.log(req.userRole);
    req.userEmail = decodedToken.email;
    console.log(req.userEmail);
    return next();

    // TODO: Verify user identity using `decodeToken.uid`
  });
  // next();
};

module.exports.isAuthenticated = (req) => {
  const userId = req.userId ? req.userId.toString() : null;

  if (userId) {
    // console.log('Usuario autenticado:', userId);
    return true;
  }
  // console.log('Usuario no autenticado');
  return false;

  // TODO: Decide based on the request information whether the user is authenticated
};

module.exports.isAdmin = (req) => {
  const userRole = req.userRole ? req.userRole.toString() : null;
  if (userRole === 'admin') {
    // console.log('Eres un Administrador Middleware ', userRole);
    return true;
  }
  return false;
};

// TODO: Decide based on the request information whether the user is an admin

module.exports.requireAuth = (req, resp, next) => (
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : next()
);

module.exports.requireAdmin = (req, resp, next) => (
  // eslint-disable-next-line no-nested-ternary
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : (!module.exports.isAdmin(req))
      ? next(403)
      : next()
);