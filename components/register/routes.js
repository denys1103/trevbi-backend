const { wrap } = require('async-middleware');

const {
  userValidation,
  validateSignUp,
} = require('./commands/verify-request-body');
const createUser = require('./commands/create-user');
const loadPage = require('./commands/load-page');

module.exports = router => {
  router.post('/register', validateSignUp, userValidation, wrap(createUser));
  router.get('/register', wrap(loadPage));

  return router;
};
