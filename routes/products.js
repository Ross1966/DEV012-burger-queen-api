const {
  requireAuth,
  requireAdmin,
} = require('../middleware/auth');
const {
  postProducts, getProducts, getProductsId, putProducts, deleteProducts,
} = require('../controller/products');

module.exports = (app, nextMain) => {
  app.get('/products', requireAuth, getProducts);

  app.get('/products/:productId', requireAuth, getProductsId);

  app.post('/products', requireAdmin, postProducts);

  app.put('/products/:productId', requireAdmin, putProducts);

  app.delete('/products/:productId', requireAdmin, deleteProducts);

  nextMain();
};
