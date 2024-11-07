const express = require('express');

const router = express.Router();

const mountRegisterRoutes = require('../components/register/routes');
const mountLoginRoutes = require('../components/login/routes');
const mountLogoutRoutes = require('../components/logout/routes');
const { isAuth } = require('../middlewares/admin-auth');
const userManagementRoutes = require('../components/userManagement/routes');
const uploadExcelRoutes = require('../components/uploadExcel/routers');
const ingredientsToAvoidRoutes = require('../components/ingredientsToAvoid/routes');

router.get('/', (req, res) => {
  return res.status(200).redirect('/');
});
router.get('/dashboard', isAuth, (req, res) => {
  res.render('pages/dashboard', { session: req.session });
});
mountRegisterRoutes(router);
mountLoginRoutes(router);
mountLogoutRoutes(router);
userManagementRoutes(router);
uploadExcelRoutes(router);
ingredientsToAvoidRoutes(router);

module.exports = router;
