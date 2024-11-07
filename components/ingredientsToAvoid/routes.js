const { wrap } = require('async-middleware');

const { isAuth } = require('../../middlewares/admin-auth');
const loadPage = require('./commands/load-page');
const { getIngredientsToAvoid } = require('./commands/get-data');

module.exports = router => {
  router.get('/ingredientsToAvoid', isAuth, wrap(loadPage));
  router.post('/getIngredientsToAvoid', getIngredientsToAvoid);
  return router;
};
