const { wrap } = require('async-middleware');

const { isAuth } = require('../../middlewares/admin-auth');
const loadPage = require('./commands/load-page');
const { getUserData, activeUser, delUser, getOneUser, updateUser, getDashboardData } = require('./commands/get-data');

module.exports = router => {
  router.get('/userManagement', isAuth, wrap(loadPage));
  router.post('/getUserData', getUserData);
  router.post('/activeUser', activeUser);
  router.post('/delUser', delUser);
  router.post('/getOneUser', getOneUser);
  router.post('/updateUser', updateUser);
  router.post('/getDashboardData', getDashboardData);

  return router;
};
