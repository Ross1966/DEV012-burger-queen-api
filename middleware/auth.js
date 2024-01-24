const jwt = require('jsonwebtoken');
const { secret } = require('../config');

/*module.exports = (secret) => (req, resp, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return next();
  }

  const [type, token] = authorization.split(' ');

  if (type.toLowerCase() !== 'bearer') {
    return next();
  }
//JWT.VERIFY -> TOKEN CORRECTO
  jwt.verify(token, secret, (err, decodedToken) => {
    if (err) {
      return next(403);
    }

    // TODO: Verify user identity using `decodeToken.uid`
    //console.log(decodedToken);
    //return decodedToken.uid;
  });
};*/

module.exports.isAuthenticated = (req) => {
  // TODO: Decide based on the request information whether the user is authenticated
  //REQUEST TIENE HEADER AUTH: TOKEN, LEER TOKEN, VERIFICAR POR DURACION, OBTENER ROL DEL USUARIO
  //ROL === ADMIN
  //TOKEN VALIDO?

  //console.log("REQ: ", req.headers);
  const { authorization } = req.headers
  //console.log("Autenticación: ", authorization);
  if (!authorization) {
    return false;
  }

  const [type, token] = authorization.split(' ');
  if (type.toLowerCase() !== 'bearer') {
    return false;
  }

  console.log("Token: ", token);
  
/*if(token){
  jwt.verify(token, secret);
  console.log("token verificado");
  return true;
} else {
  return false;
}*/

try {
  jwt.verify(token, secret);
  console.log("TOKEN VERIFICADO");
  return true;
} catch (error) {
  return false;
}

};

module.exports.isAdmin = (req) => {
  // TODO: Decide based on the request information whether the user is an admin
  //ADMINISTRADOR?
  const { authorization } = req.headers

  const [type, token] = authorization.split(' ');
  const decodedToken = jwt.verify(token, secret);
  console.log('Token decodificado:', decodedToken);

  console.log("Token de Administrador? ", decodedToken.role === 'admin');
  return decodedToken.role === 'admin';
};

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