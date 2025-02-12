var express = require('express');
var router = express.Router();

const {
  createUser,
  userSignIn,
  forgotPassword,
  getIngredientsToAvoid,
  getAvoidData,
  getAvoidListData,
  getAskAi,
  getCorrectWords,
  geminiTest,
  sendEmailTest,
  signOut,
} = require('../controllers/user');
const { isAuth } = require('../middlewares/auth');
const {
  validateUserSignUp,
  userVlidation,
  validateUserSignIn,
} = require('../middlewares/validation/user');

router.post('/create-user', validateUserSignUp, userVlidation, createUser);
router.post('/sign-in', validateUserSignIn, userVlidation, userSignIn);
router.post('/forgot-password', validateUserSignIn, userVlidation, forgotPassword);
router.get('/getIngredientsToAvoid', getIngredientsToAvoid);
router.post('/getAvoidData', getAvoidData);
router.post('/getAvoidListData', getAvoidListData);
router.post('/getAskAi', getAskAi);
router.post('/getCorrectWords', getCorrectWords);
router.get('/geminiTest', geminiTest);
router.get('/sendEmailTest', sendEmailTest);
router.post('/sign-out', isAuth, signOut);

module.exports = router;
