const { wrap } = require('async-middleware');

const { isAuth } = require('../../middlewares/admin-auth');
const loadPage = require('./commands/load-page');
const { getIngredientsToAvoid, registerIngredient, getEditIngredient, delIngredient } = require('./commands/get-data');

module.exports = router => {
  router.get('/ingredientsToAvoid', isAuth, wrap(loadPage));
  router.post('/getIngredientsToAvoid', getIngredientsToAvoid);
  router.post('/registerIngredient', registerIngredient);
  router.post('/getEditIngredient', getEditIngredient);
  router.post('/delIngredient', delIngredient);
  return router;
};
