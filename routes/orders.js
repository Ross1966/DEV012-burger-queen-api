const {
  requireAuth,
} = require('../middleware/auth');

const {
  getOrders,
  getOrdersId,
  postOrders,
  putOrders,
  deleteOrders,
} = require('../controller/orders');


module.exports = (app, nextMain) => {
  app.get('/orders', requireAuth, getOrders);

  app.get('/orders/:orderId', requireAuth, getOrdersId);

  app.post('/orders', requireAuth, postOrders);

  app.put('/orders/:orderId', requireAuth, putOrders);

  app.delete('/orders/:orderId', requireAuth, deleteOrders);

  nextMain();
};
