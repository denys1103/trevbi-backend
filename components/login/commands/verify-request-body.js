const { check, validationResult } = require('express-validator');
exports.userValidation = (req, res, next) => {
  const result = validationResult(req).array();
  if (!result.length) return next();

  let error = result[0].msg;
  let msg = {};  
  if (error == 'email'){
    error = 'Email is required!';
    msg = {email: error}
  } else {
    error = 'Password is required!';
    msg = {password: error}
  }
  const messages = {
    errors: msg,
  };
  const userInfo = req.body;

  return res.status(200).render('pages/login', { messages, userInfo });
};

exports.validateSignIn = [
  check('email').trim().isEmail().withMessage('email'),
  check('password')
    .trim()
    .not()
    .isEmpty()
    .withMessage('password'),
];