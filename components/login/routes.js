const { wrap } = require('async-middleware');

const {
  userValidation,
  validateSignIn,
} = require('./commands/verify-request-body');
const redirectToDashboard = require('./commands/redirect-to-dashboard');
const loadPage = require('./commands/load-page');

module.exports = router => {
  router.post('/login', validateSignIn, userValidation, wrap(redirectToDashboard));
  router.get('/login', wrap(loadPage));

  return router;
};
